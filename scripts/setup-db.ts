// ══════════════════════════════════════════════════════════════════
// Setup de la base Neon : exécute db/schema.sql + insère les
// paramètres par défaut (db/default-settings.json) si absents.
//
// Usage : npm run db:setup   (nécessite DATABASE_URL dans .env)
// ══════════════════════════════════════════════════════════════════
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL manquante dans .env');
    process.exit(1);
  }

  const sql = neon(url) as unknown as {
    (strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
    query: (text: string, values?: any[]) => Promise<any>;
  };
  const root = process.cwd();

  // 1. Schéma — exécution instruction par instruction (les requêtes
  //    préparées n'acceptent pas plusieurs commandes à la fois)
  console.log('📄 Exécution du schéma (db/schema.sql)...');
  const schema = readFileSync(join(root, 'db', 'schema.sql'), 'utf8');
  const statements = schema
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log('   ✅ Tables créées/vérifiées.');

  // 2. Paramètres par défaut (sans écraser l'existant)
  console.log('⚙️  Insertion des paramètres par défaut...');
  const defaults = JSON.parse(readFileSync(join(root, 'db', 'default-settings.json'), 'utf8'));
  for (const [key, value] of Object.entries(defaults)) {
    await sql`
      INSERT INTO settings (key, value)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO NOTHING
    `;
  }
  console.log(`   ✅ ${Object.keys(defaults).length} sections de paramètres vérifiées.`);

  // 3. Récapitulatif
  const cats = await sql`SELECT COUNT(*)::int AS n FROM categories`;
  const prods = await sql`SELECT COUNT(*)::int AS n FROM products`;
  const gal = await sql`SELECT COUNT(*)::int AS n FROM gallery_items`;
  console.log('\n📊 État de la base :');
  console.log(`   Catégories : ${cats[0].n} · Produits : ${prods[0].n} · Galerie : ${gal[0].n}`);
  console.log('\n🎉 Base prête. (Si catalogue/galerie vides : lancer `npm run migrate:drive`)');
}

main().catch((err) => {
  console.error('❌ Erreur setup :', err.message);
  process.exit(1);
});

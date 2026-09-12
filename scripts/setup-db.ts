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

  const sql = neon(url) as unknown as (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
  const root = process.cwd();

  // 1. Schéma
  console.log('📄 Exécution du schéma (db/schema.sql)...');
  const schema = readFileSync(join(root, 'db', 'schema.sql'), 'utf8');
  const execRaw = neon(url) as unknown as (query: string) => Promise<any>;
  await execRaw(schema);
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

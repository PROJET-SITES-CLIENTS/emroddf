// ══════════════════════════════════════════════════════════════════
// Migration unique Google Drive → Neon + Vercel Blob
//
// 1. Lit l'arborescence Drive (catégories → produits → images) avec
//    les métadonnées (prix, description, dimensions...) stockées dans
//    les descriptions des fichiers.
// 2. Télécharge chaque image (w1600) et la téléverse dans Vercel Blob.
// 3. Insère catégories / produits / images / galerie dans Neon.
// 4. Les vidéos de la galerie restent des liens d'embed Drive (à
//    remplacer plus tard par des MP4 via le tableau de bord).
//
// Idempotent : les éléments déjà migrés (slugs/URLs existants) sont
// ignorés — le script peut être relancé sans risque.
//
// Usage : npm run migrate:drive
// Prérequis : DATABASE_URL + BLOB_READ_WRITE_TOKEN dans .env
// ══════════════════════════════════════════════════════════════════
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';

// ── Configuration Drive (identique à l'ancien src/lib/api.ts) ──────
const API_KEY = process.env.VITE_GOOGLE_DRIVE_API_KEY || 'AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM';
const GALLERY_IMAGES_FOLDER_ID = '1N01xW4mbQ4caTOI-CAk9t8swCWMhuxGx';
const GALLERY_VIDEOS_FOLDER_ID = '1GPCLj9JT5sn5xD8QN_YwiJI1DWp7FqTh';
const FURNITURE_FOLDER_ID = '1yisVYsJBiyyYeP9DEg8d-BbXxPJ0Hwju';

// ── Client SQL typé simple ─────────────────────────────────────────
type SqlClient = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
const sql: SqlClient = neon(process.env.DATABASE_URL as string) as unknown as SqlClient;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquante dans .env');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN manquant dans .env');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(text: string): string {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-');
}

/** Parse les métadonnées (identique à l'ancien front) */
function parseMeta(description = ''): { prix: number; description: string; dimensions?: string; finition?: string; essence?: string } {
  const raw = (description || '').trim();
  if (!raw) return { prix: 0, description: '' };
  try {
    const meta = JSON.parse(raw);
    const prixStr = String(meta.prix || '');
    return {
      prix: parseFloat(prixStr.replace(/[^\d]/g, '')) || 0,
      description: String(meta.description || ''),
      dimensions: meta.dimensions,
      finition: meta.finition,
      essence: meta.essence,
    };
  } catch { /* format clé:valeur ci-dessous */ }

  const meta: any = { prix: 0, description: '', dimensions: '', finition: '', essence: '' };
  let currentKey = 'description';
  for (const line of raw.split('\n')) {
    const match = line.match(/^([^:]+)[:\-]\s*(.*)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (key === 'prix') { meta.prix = parseFloat(val.replace(/[^\d]/g, '')) || 0; currentKey = 'prix'; }
      else if (key === 'description') { meta.description = val; currentKey = 'description'; }
      else if (key === 'dimensions') { meta.dimensions = val; currentKey = 'dimensions'; }
      else if (key === 'finition') { meta.finition = val; currentKey = 'finition'; }
      else if (key === 'essence' || key === 'bois') { meta.essence = val; currentKey = 'essence'; }
      else if (currentKey === 'description') meta.description += (meta.description ? '\n' : '') + line;
    } else if (currentKey === 'description') {
      meta.description += (meta.description ? '\n' : '') + line;
    }
  }
  if (!meta.description && !meta.prix && !meta.dimensions && !meta.finition && !meta.essence) {
    meta.description = raw;
  }
  return meta;
}

async function fetchDriveFiles(query: string, fields: string): Promise<any[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drive API ${res.status} : ${await res.text()}`);
  const data = await res.json() as any;
  return data.files || [];
}

/** Télécharge l'image Drive en w1600 et la téléverse dans Vercel Blob */
async function migrateImage(fileId: string, blobPath: string): Promise<string | null> {
  try {
    const res = await fetch(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) throw new Error('fichier trop petit / vide');
    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: res.headers.get('content-type') || 'image/jpeg',
    });
    return blob.url;
  } catch (e: any) {
    console.warn(`   ⚠️ Échec téléchargement ${fileId} : ${e.message}`);
    return null;
  }
}

async function uniqueProductSlug(base: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(base) || 'sans-nom';
  let candidate = baseSlug;
  let suffix = 2;
  for (;;) {
    const rows = excludeId
      ? await sql`SELECT id FROM products WHERE slug = ${candidate} AND id != ${excludeId} LIMIT 1`
      : await sql`SELECT id FROM products WHERE slug = ${candidate} LIMIT 1`;
    if (rows.length === 0) return candidate;
    candidate = `${baseSlug}-${suffix++}`;
  }
}

// ── Migration du catalogue ─────────────────────────────────────────
async function migrateCatalogue() {
  console.log('\n═══ 1/2 — CATALOGUE ═══');
  const categories = await fetchDriveFiles(
    `'${FURNITURE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    'files(id, name)'
  );
  console.log(`📁 ${categories.length} catégorie(s) trouvée(s) sur Drive.`);

  let productsCreated = 0, productsSkipped = 0, imagesMigrated = 0, catOrder = 0;

  for (const category of categories) {
    const catSlug = slugify(category.name);
    // Catégorie : créer si absente
    let [catRow] = await sql`SELECT id FROM categories WHERE slug = ${catSlug} LIMIT 1`;
    if (!catRow) {
      [catRow] = await sql`
        INSERT INTO categories (name, slug, position)
        VALUES (${category.name}, ${catSlug}, ${catOrder++})
        RETURNING id
      `;
      console.log(`✅ Catégorie créée : ${category.name}`);
    } else {
      console.log(`⏭️  Catégorie existante : ${category.name}`);
    }

    // Produits
    const productFolders = await fetchDriveFiles(
      `'${category.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      'files(id, name)'
    );

    for (const productFolder of productFolders) {
      await sleep(150); // douceur avec l'API Drive

      const [existing] = await sql`
        SELECT id FROM products WHERE slug = ${slugify(productFolder.name)} LIMIT 1
      `;
      if (existing) { productsSkipped++; continue; }

      // Images du produit (avec leurs métadonnées)
      const files = await fetchDriveFiles(
        `'${productFolder.id}' in parents and mimeType contains 'image/' and trashed = false`,
        'files(id, name, description)'
      );
      if (files.length === 0) { console.log(`⏭️  Produit sans image ignoré : ${productFolder.name}`); continue; }

      // Même logique que l'ancien front : l'image « principale » est la
      // première portant une description (métadonnées), sinon la première.
      const mainImage = files.find((f: any) => (f.description || '').trim()) || files[0];
      const meta = parseMeta(mainImage?.description || '');

      const slug = await uniqueProductSlug(productFolder.name);
      const [prodRow] = await sql`
        INSERT INTO products (category_id, name, slug, description, price, dimensions, finition, essence, is_published, position)
        VALUES (${catRow.id}, ${productFolder.name}, ${slug},
                ${meta.description || ''}, ${Math.round(meta.prix) || 0},
                ${meta.dimensions || ''}, ${meta.finition || ''}, ${meta.essence || ''},
                true, 0)
        RETURNING id
      `;
      productsCreated++;
      console.log(`✅ Produit : ${productFolder.name}${meta.prix ? ` (${Math.round(meta.prix).toLocaleString('fr-FR')} GNF)` : ' (sur devis)'}`);

      // Images
      const ordered = [mainImage, ...files.filter((f: any) => f.id !== mainImage.id)];
      let position = 0;
      for (const file of ordered) {
        const ext = (String(file.name).split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const url = await migrateImage(file.id, `produits/${catSlug}/${slug}/${String(position + 1).padStart(2, '0')}.${ext}`);
        if (url) {
          await sql`
            INSERT INTO product_images (product_id, url, is_main, position)
            VALUES (${prodRow.id}, ${url}, ${file.id === mainImage.id}, ${position})
          `;
          imagesMigrated++;
        }
        position++;
      }
    }
  }
  console.log(`\n📦 Catalogue : ${productsCreated} produit(s) créé(s), ${productsSkipped} déjà existant(s), ${imagesMigrated} image(s) migrée(s).`);
}

// ── Migration de la galerie ────────────────────────────────────────
async function migrateGallery() {
  console.log('\n═══ 2/2 — GALERIE ═══');

  // Images
  const images = await fetchDriveFiles(
    `'${GALLERY_IMAGES_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
    'files(id, name)'
  );
  console.log(`🖼️  ${images.length} image(s) trouvée(s) sur Drive.`);
  let imgCreated = 0;
  let position = 0;
  for (const file of images) {
    await sleep(120);
    const title = String(file.name).replace(/\.[^/.]+$/, '');
    const [existing] = await sql`SELECT id FROM gallery_items WHERE title = ${title} LIMIT 1`;
    if (existing) continue;
    const ext = (String(file.name).split('.').pop() || 'jpg').toLowerCase();
    const url = await migrateImage(file.id, `galerie/images/${slugify(title) || file.id}.${ext}`);
    if (url) {
      await sql`
        INSERT INTO gallery_items (media_type, url, title, is_published, position)
        VALUES ('image', ${url}, ${title}, true, ${position++})
      `;
      imgCreated++;
    }
  }
  console.log(`✅ ${imgCreated} image(s) de galerie migrée(s).`);

  // Vidéos : conservées comme liens d'embed Drive (remplaçables par
  // des MP4 téléversés depuis le tableau de bord)
  const videos = await fetchDriveFiles(
    `'${GALLERY_VIDEOS_FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`,
    'files(id, name)'
  );
  console.log(`🎬 ${videos.length} vidéo(s) trouvée(s) sur Drive.`);
  let vidCreated = 0;
  for (const file of videos) {
    const title = String(file.name).replace(/\.[^/.]+$/, '');
    const embedUrl = `https://drive.google.com/file/d/${file.id}/preview`;
    const [existing] = await sql`SELECT id FROM gallery_items WHERE url = ${embedUrl} LIMIT 1`;
    if (existing) continue;
    await sql`
      INSERT INTO gallery_items (media_type, url, title, is_published, position)
      VALUES ('video', ${embedUrl}, ${title}, true, ${position++})
    `;
    vidCreated++;
  }
  console.log(`✅ ${vidCreated} vidéo(s) enregistrée(s) (embed Drive).`);
}

// ── Point d'entrée ─────────────────────────────────────────────────
async function main() {
  console.log('🚀 Migration Google Drive → Neon + Vercel Blob');
  console.log('   (les éléments déjà migrés seront ignorés)\n');

  await migrateCatalogue();
  await migrateGallery();

  const [{ cats }] = await sql`SELECT COUNT(*)::int AS cats FROM categories`;
  const [{ prods }] = await sql`SELECT COUNT(*)::int AS prods FROM products`;
  const [{ imgs }] = await sql`SELECT COUNT(*)::int AS imgs FROM product_images`;
  const [{ gal }] = await sql`SELECT COUNT(*)::int AS gal FROM gallery_items`;

  console.log('\n═══ RÉCAPITULATIF FINAL ═══');
  console.log(`   Catégories      : ${cats}`);
  console.log(`   Produits        : ${prods}`);
  console.log(`   Images produits : ${imgs}`);
  console.log(`   Galerie         : ${gal}`);
  console.log('\n🎉 Migration terminée. Vérifiez le site puis le tableau de bord (/admin).');
}

main().catch((err) => {
  console.error('❌ Erreur migration :', err);
  process.exit(1);
});

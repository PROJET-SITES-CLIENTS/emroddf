// Test des requêtes des API publiques contre la vraie base Neon
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log('— Requêtes du catalogue —');
  const cats = await sql`SELECT id, name, slug FROM categories ORDER BY position, name`;
  console.log('categories:', JSON.stringify(cats));
  const prods = await sql`
    SELECT p.id, p.name, p.slug, p.price, c.name AS category, c.slug AS category_slug,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id
             ORDER BY pi.is_main DESC, pi.position, pi.id LIMIT 1) AS main_image_url
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_published ORDER BY p.position, p.created_at DESC
  `;
  console.log('produits publiés:', prods.length);
  const gal = await sql`SELECT id, media_type, title FROM gallery_items WHERE is_published ORDER BY position, created_at DESC`;
  console.log('galerie:', gal.length);
  const settings = await sql`SELECT key FROM settings ORDER BY key`;
  console.log('settings:', settings.map((s: any) => s.key).join(', '));
  const stats = await sql`SELECT COUNT(*)::int AS leads FROM leads`;
  console.log('leads:', stats[0].leads);
  // Test insertion/lecture/suppression produit complet (cycle CRUD)
  const [cat] = await sql`INSERT INTO categories (name, slug, position) VALUES ('TEST', 'test', 99) RETURNING id, slug`;
  const [prod] = await sql`INSERT INTO products (category_id, name, slug, description, price, is_published) VALUES (${cat.id}, 'Produit Test', 'produit-test', 'desc', 1500000, true) RETURNING id, slug`;
  const [img] = await sql`INSERT INTO product_images (product_id, url, is_main, position) VALUES (${prod.id}, 'https://exemple.com/img.jpg', true, 0) RETURNING id`;
  const [detail] = await sql`SELECT p.name, p.price, c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=${prod.slug} AND p.is_published AND (c.slug = ${cat.slug} OR ${cat.slug}='divers' AND c.slug IS NULL) LIMIT 1`;
  console.log('— Test CRUD — produit créé:', detail.name, detail.price, 'GNF, route: /catalogue/' + detail.category_slug + '/' + prod.slug);
  await sql`DELETE FROM products WHERE id = ${prod.id}`;
  await sql`DELETE FROM categories WHERE id = ${cat.id}`;
  console.log('Nettoyage test: OK');
  console.log('\n✅ Toutes les requêtes du système fonctionnent sur Neon');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });

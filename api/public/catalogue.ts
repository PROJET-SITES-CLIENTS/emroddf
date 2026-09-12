// ══════════════════════════════════════════════════════════════════
// GET /api/public/catalogue
// Remplace la lecture Google Drive : catégories + produits publiés
// avec image principale et nombre d'images.
// ══════════════════════════════════════════════════════════════════
import { db } from '../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
    const sql = db();

    const categories = await sql`
      SELECT c.id, c.name, c.slug,
             (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id AND p.is_published) AS product_count
      FROM categories c
      ORDER BY c.position, c.name
    `;

    const products = await sql`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.dimensions,
             p.finition, p.essence, p.is_published,
             c.name AS category, c.slug AS category_slug,
             (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.is_main DESC, pi.position, pi.id
               LIMIT 1) AS main_image_url,
             (SELECT COUNT(*)::int FROM product_images pi WHERE pi.product_id = p.id) AS image_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_published
      ORDER BY p.position, p.created_at DESC
    `;

    return res.status(200).json({
      categories: categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c.product_count,
      })),
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Divers',
        categorySlug: p.category_slug || 'divers',
        modelSlug: p.slug,
        mainImageUrl: p.main_image_url || null,
        prix: p.price > 0 ? `${new Intl.NumberFormat('fr-FR').format(p.price)} GNF` : '',
        prixNumeric: Number(p.price),
        description: p.description || '',
        dimensions: p.dimensions || '',
        finition: p.finition || '',
        essence: p.essence || '',
        imageCount: p.image_count,
      })),
    });
  } catch (err: any) {
    console.error('catalogue error:', err);
    return res.status(500).json({ error: 'Erreur de chargement du catalogue' });
  }
}

// ══════════════════════════════════════════════════════════════════
// GET /api/public/catalogue
// Remplace la lecture Google Drive : catégories (sections +
// sous-sections) et produits publiés avec image principale,
// vidéos, et règles d'acompte.
// ══════════════════════════════════════════════════════════════════
import { db } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    const sql = db();

    const categories = await sql`
      SELECT c.id, c.name, c.slug, c.parent_id, c.position,
             p.name AS parent_name, p.slug AS parent_slug,
             (SELECT COUNT(*)::int FROM products pr
               WHERE pr.category_id = c.id AND pr.is_published) AS product_count
      FROM categories c
      LEFT JOIN categories p ON p.id = c.parent_id
      ORDER BY (COALESCE(p.position, c.position)), c.position, c.name
    `;

    const products = await sql`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.dimensions,
             p.finition, p.essence, p.deposit_mode, p.deposit_value,
             c.name AS category, c.slug AS category_slug,
             pc.name AS section_name, pc.slug AS section_slug,
             (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'image'
               ORDER BY pi.is_main DESC, pi.position, pi.id
               LIMIT 1) AS main_image_url,
             (SELECT COUNT(*)::int FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'image') AS image_count,
             (SELECT COUNT(*)::int FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'video') AS video_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories pc ON pc.id = c.parent_id
      WHERE p.is_published
      ORDER BY p.position, p.created_at DESC
    `;

    return res.status(200).json({
      categories: categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parent_id,
        parentName: c.parent_name,
        parentSlug: c.parent_slug,
        productCount: c.product_count,
      })),
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Divers',
        categorySlug: p.category_slug || 'divers',
        sectionName: p.section_name || p.category || 'Divers',
        sectionSlug: p.section_slug || p.category_slug || 'divers',
        modelSlug: p.slug,
        mainImageUrl: p.main_image_url || null,
        prix: p.price > 0 ? `${new Intl.NumberFormat('fr-FR').format(p.price)} GNF` : '',
        prixNumeric: Number(p.price),
        description: p.description || '',
        dimensions: p.dimensions || '',
        finition: p.finition || '',
        essence: p.essence || '',
        depositMode: p.deposit_mode,
        depositValue: Number(p.deposit_value),
        imageCount: p.image_count,
        videoCount: p.video_count,
      })),
    });
  } catch (err: any) {
    console.error('catalogue error:', err);
    return res.status(500).json({ error: 'Erreur de chargement du catalogue' });
  }
}

// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/products — liste admin (incl. non publiés)
// POST /api/admin/products — création produit
//   { name, categoryId?, description?, price?, dimensions?, finition?,
//     essence?, isPublished?, position? }
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../_lib/auth';
import { db, uniqueSlug } from '../_lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT p.id, p.name, p.slug, p.description, p.price, p.dimensions,
               p.finition, p.essence, p.is_published, p.position, p.created_at,
               p.category_id, c.name AS category_name, c.slug AS category_slug,
               (SELECT pi.url FROM product_images pi
                 WHERE pi.product_id = p.id
                 ORDER BY pi.is_main DESC, pi.position, pi.id LIMIT 1) AS main_image_url,
               (SELECT COUNT(*)::int FROM product_images pi WHERE pi.product_id = p.id) AS image_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.position, p.created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || '').trim().slice(0, 200);
      if (!name) return res.status(400).json({ error: 'Nom du produit requis' });

      const categoryId = Number(body.categoryId) || null;
      const price = Math.max(0, Math.round(Number(body.price) || 0));
      const slug = await uniqueSlug('products', name);

      const [row] = await sql`
        INSERT INTO products (category_id, name, slug, description, price, dimensions, finition, essence, is_published, position)
        VALUES (
          ${categoryId},
          ${name},
          ${slug},
          ${String(body.description || '').slice(0, 5000)},
          ${price},
          ${String(body.dimensions || '').slice(0, 300)},
          ${String(body.finition || '').slice(0, 300)},
          ${String(body.essence || '').slice(0, 300)},
          ${body.isPublished !== false},
          ${Number(body.position) || 0}
        )
        RETURNING id, name, slug, created_at
      `;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('products error:', err);
    return res.status(500).json({ error: 'Erreur produits' });
  }
}

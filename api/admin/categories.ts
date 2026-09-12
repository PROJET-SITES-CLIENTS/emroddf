// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/categories — liste complète
// POST /api/admin/categories — { name, position? } : création
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../_lib/auth';
import { db, uniqueSlug } from '../_lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT c.id, c.name, c.slug, c.position, c.created_at,
               (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS product_count
        FROM categories c
        ORDER BY c.position, c.name
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || '').trim().slice(0, 120);
      if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

      const slug = await uniqueSlug('categories', name);
      const [row] = await sql`
        INSERT INTO categories (name, slug, position)
        VALUES (${name}, ${slug}, ${Number(body.position) || 0})
        RETURNING id, name, slug, position, created_at
      `;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('categories error:', err);
    return res.status(500).json({ error: 'Erreur catégories' });
  }
}

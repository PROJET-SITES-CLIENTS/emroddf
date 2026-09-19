// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/categories — liste complète (sections + sous-sections)
// POST /api/admin/categories — { name, parentId?, position? } : création
//   parentId NULL = section principale ; sinon sous-section (le parent
//   doit être une section de premier niveau — 2 niveaux maximum).
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../lib/auth';
import { db, uniqueSlug } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT c.id, c.name, c.slug, c.parent_id, c.position, c.created_at,
               p.name AS parent_name,
               (SELECT COUNT(*)::int FROM products pr WHERE pr.category_id = c.id) AS product_count
        FROM categories c
        LEFT JOIN categories p ON p.id = c.parent_id
        ORDER BY (COALESCE(p.position, c.position)), c.position, c.name
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || '').trim().slice(0, 120);
      if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

      // Validation du parent : section de premier niveau uniquement
      let parentId: number | null = null;
      if (body.parentId !== undefined && body.parentId !== null && body.parentId !== '') {
        parentId = Number(body.parentId);
        const [parent] = await sql`
          SELECT id FROM categories WHERE id = ${parentId} AND parent_id IS NULL LIMIT 1
        `;
        if (!parent) {
          return res.status(400).json({ error: 'Le parent doit être une section principale (2 niveaux maximum).' });
        }
      }

      const slug = await uniqueSlug('categories', name);
      const [row] = await sql`
        INSERT INTO categories (name, slug, parent_id, position)
        VALUES (${name}, ${slug}, ${parentId}, ${Number(body.position) || 0})
        RETURNING id, name, slug, parent_id, position, created_at
      `;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('categories error:', err);
    return res.status(500).json({ error: 'Erreur catégories' });
  }
}

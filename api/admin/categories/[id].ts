// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/categories/[id] — { name?, position? }
// DELETE /api/admin/categories/[id] — supprime (produits orphelins de
//         catégorie mais conservés)
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../_lib/auth';
import { db, uniqueSlug } from '../../_lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const updates: string[] = [];

      let name: string | undefined;
      let position: number | undefined;
      if (body.name !== undefined) {
        name = String(body.name).trim().slice(0, 120);
        if (!name) return res.status(400).json({ error: 'Nom invalide' });
        updates.push('name');
      }
      if (body.position !== undefined) {
        position = Number(body.position) || 0;
        updates.push('position');
      }
      if (updates.length === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

      const slug = name !== undefined ? await uniqueSlug('categories', name, id) : undefined;

      const [row] = await sql`
        UPDATE categories SET
          name = COALESCE(${name ?? null}, name),
          position = COALESCE(${position ?? null}, position),
          slug = COALESCE(${slug ?? null}, slug)
        WHERE id = ${id}
        RETURNING id, name, slug, position
      `;
      if (!row) return res.status(404).json({ error: 'Catégorie introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM categories WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Catégorie introuvable' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('category [id] error:', err);
    return res.status(500).json({ error: 'Erreur catégorie' });
  }
}

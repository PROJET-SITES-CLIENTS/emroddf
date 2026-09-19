// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/categories/[id] — { name?, position?, parentId? }
// DELETE /api/admin/categories/[id] — supprime (les sous-sections et
//         produits deviennent rattachés au niveau supérieur)
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../../lib/auth';
import { db, uniqueSlug } from '../../../lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      let name: string | undefined;
      let position: number | undefined;
      let parentId: number | null | undefined;
      if (body.name !== undefined) {
        name = String(body.name).trim().slice(0, 120);
        if (!name) return res.status(400).json({ error: 'Nom invalide' });
      }
      if (body.position !== undefined) position = Number(body.position) || 0;

      if (body.parentId !== undefined) {
        if (body.parentId === null || body.parentId === '' ) {
          parentId = null; // promouvoir en section principale
        } else {
          parentId = Number(body.parentId);
          if (parentId === id) {
            return res.status(400).json({ error: 'Une catégorie ne peut pas être sa propre sous-section.' });
          }
          const [parent] = await sql`
            SELECT id FROM categories WHERE id = ${parentId} AND parent_id IS NULL LIMIT 1
          `;
          if (!parent) {
            return res.status(400).json({ error: 'Le parent doit être une section principale (2 niveaux maximum).' });
          }
          // Interdire de transformer en sous-section une catégorie qui
          // contient déjà des sous-sections (évite un 3e niveau)
          const [{ count }] = await sql`
            SELECT COUNT(*)::int AS count FROM categories WHERE parent_id = ${id}
          `;
          if (count > 0) {
            return res.status(400).json({ error: "Cette section contient des sous-sections : elle ne peut pas devenir une sous-section." });
          }
        }
      }

      const updatesCount = [name, position, parentId].filter((v) => v !== undefined).length;
      if (updatesCount === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

      const slug = name !== undefined ? await uniqueSlug('categories', name, id) : undefined;

      const [row] = await sql`
        UPDATE categories SET
          name = COALESCE(${name ?? null}, name),
          position = COALESCE(${position ?? null}, position),
          parent_id = COALESCE(${parentId ?? null}, parent_id),
          slug = COALESCE(${slug ?? null}, slug)
        WHERE id = ${id}
        RETURNING id, name, slug, parent_id, position
      `;
      if (!row) return res.status(404).json({ error: 'Catégorie introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      // Les sous-sections sont promues au niveau supérieur (parent_id → NULL)
      await sql`UPDATE categories SET parent_id = NULL WHERE parent_id = ${id}`;
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

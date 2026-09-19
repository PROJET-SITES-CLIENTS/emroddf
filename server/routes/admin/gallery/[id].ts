// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/gallery/[id] — { title?, isPublished?, position?, url? }
//   body.order global géré via PUT /api/admin/gallery/reorder
// DELETE /api/admin/gallery/[id] — supprime (Blob inclus)
// ══════════════════════════════════════════════════════════════════
import { del } from '@vercel/blob';
import { requireAdmin } from '../../../lib/auth';
import { db } from '../../../lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const title = body.title !== undefined ? String(body.title).slice(0, 300) : undefined;
      const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : undefined;
      const position = body.position !== undefined ? Number(body.position) || 0 : undefined;
      const url = body.url !== undefined ? String(body.url).slice(0, 1000) : undefined;

      const [row] = await sql`
        UPDATE gallery_items SET
          title = COALESCE(${title ?? null}, title),
          is_published = COALESCE(${isPublished ?? null}, is_published),
          position = COALESCE(${position ?? null}, position),
          url = COALESCE(${url ?? null}, url)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Élément introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM gallery_items WHERE id = ${id} RETURNING url`;
      if (!row) return res.status(404).json({ error: 'Élément introuvable' });
      if (String(row.url).includes('.blob.')) {
        try { await del(row.url); } catch (e) { console.error('blob del error:', e); }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('gallery [id] error:', err);
    return res.status(500).json({ error: 'Erreur galerie' });
  }
}

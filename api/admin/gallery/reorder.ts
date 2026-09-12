// ══════════════════════════════════════════════════════════════════
// PUT /api/admin/gallery/reorder — { order: [id, id, ...] }
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../_lib/auth';
import { db } from '../../_lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!Array.isArray(body.order)) return res.status(400).json({ error: 'Ordre manquant' });

    const sql = db();
    const ids: number[] = body.order.map((n: any) => Number(n)).filter(Number.isInteger);
    for (let pos = 0; pos < ids.length; pos++) {
      await sql`UPDATE gallery_items SET position = ${pos} WHERE id = ${ids[pos]}`;
    }
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('gallery reorder error:', err);
    return res.status(500).json({ error: 'Erreur de réordonnancement' });
  }
}

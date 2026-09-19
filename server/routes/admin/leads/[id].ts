// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/leads/[id] — { status } (new|contacted|archived)
// DELETE /api/admin/leads/[id]
// ══════════════════════════════════════════════════════════════════
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
      const status = String(body.status || '');
      if (!['new', 'contacted', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      const [row] = await sql`
        UPDATE leads SET status = ${status} WHERE id = ${id} RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Prospect introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Prospect introuvable' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('lead [id] error:', err);
    return res.status(500).json({ error: 'Erreur prospect' });
  }
}

// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/orders/[id] — { paymentStatus } mise à jour manuelle
// DELETE /api/admin/orders/[id]
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../../_lib/auth';
import { db } from '../../../_lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const status = String(body.paymentStatus || '');
      if (!['pending', 'paid', 'cancelled', 'failed', 'refunded'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      const [row] = await sql`
        UPDATE orders
        SET payment_status = ${status},
            paid_at = CASE WHEN ${status} = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Commande introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Commande introuvable' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('order [id] error:', err);
    return res.status(500).json({ error: 'Erreur commande' });
  }
}

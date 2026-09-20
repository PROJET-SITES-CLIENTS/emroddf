// ══════════════════════════════════════════════════════════════════
// GET /api/admin/orders — liste des commandes (?status=)
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../lib/auth';
import { db } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = db();
    const status = String(req.query.status || '');
    const validStatus = ['pending', 'paid', 'cancelled', 'failed', 'refunded'].includes(status) ? status : null;

    const rows = await sql`
      SELECT id, reference, product_id, product_name, price_total, deposit_amount,
             paid_amount, customer_name, customer_phone, customer_address,
             payment_status, djomy_transaction_id, created_at, paid_at,
             product_details, metadata
      FROM orders
      WHERE (${validStatus}::text IS NULL OR payment_status = ${validStatus})
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return res.status(200).json(rows);
  } catch (err: any) {
    console.error('orders admin error:', err);
    return res.status(500).json({ error: 'Erreur commandes' });
  }
}

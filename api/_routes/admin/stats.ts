// ══════════════════════════════════════════════════════════════════
// GET /api/admin/stats — compteurs de la page d'accueil du dashboard
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../_lib/auth';
import { db } from '../../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM leads)                                          AS leads_total,
        (SELECT COUNT(*)::int FROM leads WHERE status = 'new')                     AS leads_new,
        (SELECT COUNT(*)::int FROM leads WHERE created_at >= now() - interval '1 day') AS leads_today,
        (SELECT COUNT(*)::int FROM orders)                                         AS orders_total,
        (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'paid')           AS orders_paid,
        (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'pending')        AS orders_pending,
        (SELECT COALESCE(SUM(paid_amount), 0)::bigint FROM orders WHERE payment_status = 'paid') AS revenue,
        (SELECT COUNT(*)::int FROM products)                                       AS products_total,
        (SELECT COUNT(*)::int FROM products WHERE is_published)                    AS products_published,
        (SELECT COUNT(*)::int FROM gallery_items WHERE is_published)               AS gallery_published
    `;

    const recentLeads = await sql`
      SELECT id, first_name, last_name, phone, service_type, status, created_at
      FROM leads ORDER BY created_at DESC LIMIT 6
    `;
    const recentOrders = await sql`
      SELECT id, reference, product_name, customer_name, payment_status, deposit_amount, created_at
      FROM orders ORDER BY created_at DESC LIMIT 6
    `;

    return res.status(200).json({
      ...counts,
      revenue: Number(counts.revenue),
      recentLeads,
      recentOrders,
    });
  } catch (err: any) {
    console.error('stats error:', err);
    return res.status(500).json({ error: 'Erreur de chargement des statistiques' });
  }
}

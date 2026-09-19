// ══════════════════════════════════════════════════════════════════
// GET /api/admin/leads — liste des prospects (?status=&q=)
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../lib/auth';
import { db } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = db();
    const status = String(req.query.status || '');
    const q = String(req.query.q || '').trim().slice(0, 100);

    const validStatus = ['new', 'contacted', 'archived'].includes(status) ? status : null;
    const like = q ? `%${q}%` : null;

    const rows = await sql`
      SELECT id, first_name, last_name, phone, email, service_type, message, source, status, created_at
      FROM leads
      WHERE (${validStatus}::text IS NULL OR status = ${validStatus})
        AND (${like}::text IS NULL OR first_name ILIKE ${like} OR last_name ILIKE ${like}
             OR phone ILIKE ${like} OR email ILIKE ${like})
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return res.status(200).json(rows);
  } catch (err: any) {
    console.error('leads admin error:', err);
    return res.status(500).json({ error: 'Erreur prospects' });
  }
}

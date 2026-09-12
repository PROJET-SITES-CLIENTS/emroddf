// ══════════════════════════════════════════════════════════════════
// GET /api/admin/session — vérifie la validité de la session
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  return res.status(200).json({ authenticated: true });
}

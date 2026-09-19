// ══════════════════════════════════════════════════════════════════
// PUT /api/admin/password — { currentPassword, newPassword }
// Change le mot de passe administrateur (stocké haché en base).
// ══════════════════════════════════════════════════════════════════
import { checkCredentials, requireAdmin, setPassword } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel.' });
    }

    // Vérification du mot de passe actuel
    const email = (process.env.ADMIN_EMAIL || '').trim();
    const ok = await checkCredentials(email, currentPassword);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 600)); // ralentir le brute-force
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    await setPassword(newPassword);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('password change error:', err);
    return res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
}

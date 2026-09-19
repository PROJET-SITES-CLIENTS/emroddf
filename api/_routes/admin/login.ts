// ══════════════════════════════════════════════════════════════════
// POST /api/admin/login — { email, password } → cookie de session
// ══════════════════════════════════════════════════════════════════
import { checkCredentials, createSessionToken, setSessionCookie } from '../../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { email, password } = body;

    if (!email || !password || !(await checkCredentials(email, password))) {
      // Petit délai pour ralentir le brute-force
      await new Promise((r) => setTimeout(r, 600));
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    setSessionCookie(res, createSessionToken());
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erreur de connexion' });
  }
}

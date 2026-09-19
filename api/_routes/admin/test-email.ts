// ══════════════════════════════════════════════════════════════════
// POST /api/admin/test-email — envoie un email de test avec la
// configuration SMTP actuelle (Paramètres → Notifications).
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../_lib/auth';
import { sendNotification } from '../../_lib/mailer';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sent = await sendNotification(
      '✅ Test de configuration SMTP — Site EMROD',
      [
        ['Test', 'Si vous lisez cet email, la configuration SMTP fonctionne.'],
        ['Date', new Date().toLocaleString('fr-FR')],
      ],
      { label: 'Ouvrir le tableau de bord', url: `${process.env.VITE_PUBLIC_URL || 'https://emrod.vercel.app'}/admin` }
    );

    if (!sent) {
      return res.status(400).json({
        sent: false,
        error: "Aucun SMTP configuré — renseignez la section Notifications (Paramètres) ou les variables SMTP_*.",
      });
    }
    return res.status(200).json({ sent: true });
  } catch (err: any) {
    console.error('test-email error:', err);
    return res.status(500).json({ sent: false, error: err.message });
  }
}

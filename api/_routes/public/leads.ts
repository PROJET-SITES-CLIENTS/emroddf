// ══════════════════════════════════════════════════════════════════
// POST /api/public/leads
// Enregistre un prospect (formulaire contact / popup) en base.
// Remplace l'envoi vers Google Apps Script.
// Anti-spam : champ pot de miel "website" + limites de longueur.
// ══════════════════════════════════════════════════════════════════
import { db } from '../../_lib/db';
import { sendNotification } from '../../_lib/mailer';

const MAX = {
  firstName: 100, lastName: 100, phone: 40, email: 200,
  serviceType: 100, message: 3000, source: 100,
};

function clean(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Pot de miel : les robots remplissent le champ caché "website"
    if (clean(body.website, 200)) {
      // Réponse factice pour ne pas alerter le robot
      return res.status(200).json({ success: true });
    }

    const firstName = clean(body.firstName ?? body.prenom, MAX.firstName);
    const phone = clean(body.phone ?? body.telephone, MAX.phone);
    const email = clean(body.email, MAX.email);

    if (!firstName && !phone && !email) {
      return res.status(400).json({ error: 'Formulaire vide' });
    }

    const sql = db();
    await sql`
      INSERT INTO leads (first_name, last_name, phone, email, service_type, message, source)
      VALUES (
        ${firstName},
        ${clean(body.lastName ?? body.nom, MAX.lastName)},
        ${phone},
        ${email},
        ${clean(body.serviceType, MAX.serviceType)},
        ${clean(body.message, MAX.message)},
        ${clean(body.source ?? body.type, MAX.source)}
      )
    `;

    // Notification email (ne bloque jamais le flux principal)
    await sendNotification(
      `🆕 Nouveau prospect — ${firstName} ${clean(body.lastName ?? body.nom, MAX.lastName)}`.trim(),
      [
        ['Nom', `${firstName} ${clean(body.lastName ?? body.nom, MAX.lastName)}`.trim()],
        ['Téléphone', phone || '—'],
        ['Email', email || '—'],
        ['Service', clean(body.serviceType, MAX.serviceType) || '—'],
        ['Source', clean(body.source ?? body.type, MAX.source) || '—'],
        ['Message', clean(body.message, MAX.message) || '—'],
      ],
      { label: 'Voir dans le tableau de bord', url: `${process.env.VITE_PUBLIC_URL || ''}/admin/prospects` }
    ).catch(() => {});

    return res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('leads error:', err);
    return res.status(500).json({ error: "Erreur d'enregistrement de la demande" });
  }
}

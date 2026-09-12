// ══════════════════════════════════════════════════════════════════
// POST /api/payment/webhook
// Webhook Djomy : valide la signature HMAC sur le raw body, puis met
// à jour la commande correspondante en base (statut + montant payé).
// Plus aucun appel Google Apps Script.
// ══════════════════════════════════════════════════════════════════
import crypto from 'crypto';
import { db } from '../_lib/db';

// Désactive le parseur par défaut de Vercel pour lire le flux brut
// (indispensable : la signature HMAC doit porter sur le corps exact)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ── 1. Validation de la signature ─────────────────────────────
    const signatureHeader = req.headers['x-webhook-signature'];
    if (!signatureHeader) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    if (!clientSecret) throw new Error('Missing Client Secret');

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');

    const providedSignature = String(signatureHeader).replace('v1:', '');
    const expectedSignature = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex');

    const a = Buffer.from(providedSignature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error('Signature invalide! Reçue:', providedSignature, 'Attendue:', expectedSignature);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // ── 2. Traitement de l'événement authentifié ─────────────────
    const parsedBody = JSON.parse(rawBody);
    const { eventType, data } = parsedBody;
    const sql = db();

    // Retrouver la commande via la référence marchand (jamais via des
    // données client falsifiables)
    const reference =
      parsedBody.merchantPaymentReference ||
      data?.merchantPaymentReference ||
      data?.metadata?.merchantPaymentReference ||
      data?.reference;

    if (!reference) {
      console.error('Webhook sans référence de commande:', parsedBody);
      return res.status(200).json({ success: true }); // ACK pour éviter les rejeux
    }

    if (eventType === 'payment.success') {
      const actualPaid = Number(data?.paidAmount || data?.amount || 0);

      const [order] = await sql`
        SELECT id, deposit_amount, price_total, payment_status FROM orders
        WHERE reference = ${String(reference)} OR djomy_transaction_id = ${String(data?.transactionId || data?.id || '')}
        LIMIT 1
      `;

      if (!order) {
        console.error('Webhook: commande introuvable pour référence', reference);
        return res.status(200).json({ success: true });
      }

      if (order.payment_status === 'paid') {
        return res.status(200).json({ success: true }); // déjà traité (idempotence)
      }

      // ⚠️ Contrôle anti-fraude : le montant payé doit couvrir l'acompte attendu
      if (actualPaid < order.deposit_amount) {
        console.error(
          `⚠️ ALERTE FRAUDE : commande ${reference} — payé ${actualPaid} GNF < acompte attendu ${order.deposit_amount} GNF`
        );
        await sql`
          UPDATE orders SET payment_status = 'failed', paid_amount = ${actualPaid},
            metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{fraudAlert}', 'true'::jsonb)
          WHERE id = ${order.id}
        `;
        return res.status(200).json({ success: true });
      }

      await sql`
        UPDATE orders
        SET payment_status = 'paid', paid_amount = ${actualPaid}, paid_at = now(),
            djomy_transaction_id = COALESCE(NULLIF(${String(data?.transactionId || data?.id || '')}, ''), djomy_transaction_id)
        WHERE id = ${order.id}
      `;
      console.log(`✅ Commande ${reference} marquée PAYÉE (${actualPaid} GNF).`);
    } else if (eventType === 'payment.failed' || eventType === 'payment.cancelled') {
      await sql`
        UPDATE orders SET payment_status = ${eventType === 'payment.failed' ? 'failed' : 'cancelled'}
        WHERE reference = ${String(reference)} AND payment_status = 'pending'
      `;
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}

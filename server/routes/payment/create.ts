// ══════════════════════════════════════════════════════════════════
// POST /api/payment/create
// Initie un paiement Djomy pour l'acompte d'un produit.
//
// 🔒 SÉCURITÉ : le prix n'est JAMAIS fourni par le client.
// Le serveur lit le produit en base (Neon) et calcule l'acompte.
// La commande est créée en base AVANT la redirection (statut pending),
// puis mise à jour par le webhook signé Djomy.
// ══════════════════════════════════════════════════════════════════
import * as crypto from 'crypto';
import { db } from '../../lib/db';
import { computeDeposit } from '../../lib/deposit';

function formatPhoneNumber(phone: string) {
  let clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+')) {
    clean = '00' + clean.substring(1);
  } else if (clean.startsWith('224')) {
    clean = '00' + clean;
  } else if (clean.startsWith('6')) {
    clean = '00224' + clean;
  }
  return clean;
}

function generateHmac(stringToSign: string, clientSecret: string) {
  return crypto.createHmac('sha256', clientSecret).update(stringToSign).digest('hex');
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { productId, payerNumber } = body;
    const nom = String(body.nom || '').slice(0, 120);
    const prenom = String(body.prenom || '').slice(0, 120);
    const telephone = String(body.telephone || payerNumber || '').slice(0, 40);
    const adresse = String(body.adresse || '').slice(0, 500);

    if (!payerNumber || !nom) {
      return res.status(400).json({ error: 'Informations client incomplètes' });
    }

    const API_URL = 'https://api.djomy.africa';
    const clientId = process.env.DJOMY_CLIENT_ID;
    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;
    const baseUrl = process.env.VITE_PUBLIC_URL || 'https://emrod.vercel.app';

    if (!clientId || !clientSecret) throw new Error('Clés API Djomy non configurées');
    if (!partnerDomain) throw new Error('DJOMY_PARTNER_DOMAIN non configuré');

    // ── 1. Produit + prix AUTHENTIQUE depuis la base ───────────────
    const sql = db();
    const [product] = await sql`
      SELECT p.id, p.name, p.price, p.description, p.dimensions, p.finition,
             p.essence, p.deposit_mode, p.deposit_value,
             (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'image'
               ORDER BY pi.is_main DESC, pi.position, pi.id LIMIT 1) AS main_image_url
      FROM products p
      WHERE p.id = ${Number(productId)} AND p.is_published
      LIMIT 1
    `;
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable ou non disponible' });
    }
    const priceTotal = Number(product.price);
    if (!priceTotal || priceTotal <= 0) {
      return res.status(400).json({
        error: "Ce produit n'a pas de prix défini ou est sur devis. Le paiement en ligne n'est pas possible.",
      });
    }

    // ── 2. Acompte selon la règle DU PRODUIT (%, fixe, ou désactivé) ─
    // computeDeposit retourne null si le paiement est désactivé (mode 'none')
    const acompteCalcule = computeDeposit(priceTotal, product.deposit_mode, Number(product.deposit_value));
    if (acompteCalcule === null || acompteCalcule <= 0) {
      return res.status(400).json({
        error: "Le paiement en ligne est désactivé pour ce produit. La commande se fait directement auprès de l'atelier.",
      });
    }

    // ── 3. Création de la commande en base (pending) ───────────────
    const reference = `EMROD-${Date.now()}`;
    // Snapshot des détails du produit tels que vus par le client
    const productDetails = {
      nom: product.name,
      description: product.description || '',
      dimensions: product.dimensions || '',
      finition: product.finition || '',
      essence: product.essence || '',
      imageUrl: product.main_image_url || null,
      acompteMode: product.deposit_mode,
      acompteValeur: Number(product.deposit_value),
      prixTotal: priceTotal,
    };
    const [order] = await sql`
      INSERT INTO orders (reference, product_id, product_name, price_total, deposit_amount,
                          customer_name, customer_phone, customer_address, payment_status, product_details)
      VALUES (${reference}, ${product.id}, ${product.name}, ${priceTotal}, ${acompteCalcule},
              ${`${nom} ${prenom}`.trim()}, ${telephone}, ${adresse}, 'pending',
              ${JSON.stringify(productDetails)}::jsonb)
      RETURNING id, reference
    `;

    // ── 4. Authentification Djomy ─────────────────────────────────
    const signature = generateHmac(clientId, clientSecret);
    const apiKeyHeader = `${clientId}:${signature}`;

    const authResponse = await fetch(`${API_URL}/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKeyHeader,
        'X-PARTNER-DOMAIN': partnerDomain,
      },
    });
    if (!authResponse.ok) {
      const authErr = await authResponse.text();
      console.error('Auth error:', authErr);
      await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${order.id}`;
      return res.status(500).json({ error: 'Erreur authentification Djomy', details: authErr });
    }
    const authData = await authResponse.json();
    const token = authData.data?.token || authData.data?.accessToken;
    if (!token) {
      await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${order.id}`;
      return res.status(500).json({ error: 'Jeton manquant dans la réponse', details: authData });
    }

    // ── 5. Création du lien de paiement ───────────────────────────
    const djomyPayload = {
      amount: acompteCalcule,
      countryCode: 'GN',
      payerNumber: formatPhoneNumber(payerNumber),
      description: `Acompte - ${product.name}`,
      merchantPaymentReference: reference,
      returnUrl: `${baseUrl}/payment/success?ref=${reference}`,
      cancelUrl: `${baseUrl}/payment/cancel?ref=${reference}`,
      metadata: { orderId: String(order.id), productId: String(product.id) },
    };

    const paymentResponse = await fetch(`${API_URL}/v1/payments/gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKeyHeader,
        'X-PARTNER-DOMAIN': partnerDomain,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(djomyPayload),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error('Payment error:', errorData);
      await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${order.id}`;
      return res.status(500).json({ error: 'Erreur création paiement Djomy', details: errorData });
    }

    const paymentData = await paymentResponse.json();
    const redirectUrl = paymentData.data?.redirectUrl || paymentData.data?.paymentUrl || paymentData.data?.url;
    const transactionId = paymentData.data?.transactionId || paymentData.data?.id || '';

    // Sauvegarde de l'ID de transaction pour le suivi
    if (transactionId) {
      await sql`UPDATE orders SET djomy_transaction_id = ${String(transactionId)} WHERE id = ${order.id}`;
    }

    return res.status(200).json({
      success: true,
      redirectUrl,
      reference: order.reference,
      transactionId,
    });
  } catch (error: any) {
    console.error('Erreur générale :', error);
    return res.status(500).json({ error: error.message });
  }
}

import * as crypto from 'crypto';

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
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prixTotalNumeric, payerNumber, description, merchantPaymentReference, metadata } = req.body;
    
    const API_URL = 'https://api.djomy.africa';
    const clientId = process.env.DJOMY_CLIENT_ID;
    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;
    const baseUrl = process.env.VITE_PUBLIC_URL || 'https://emrod.vercel.app';
    
    if (!clientId || !clientSecret) {
      throw new Error("Clés API Djomy non configurées");
    }
    if (!partnerDomain) {
      throw new Error("DJOMY_PARTNER_DOMAIN non configuré");
    }

    const acompteCalcule = Math.round(Number(prixTotalNumeric) * 0.6);
    if (!acompteCalcule || acompteCalcule === 0) {
      return res.status(400).json({ error: "Ce produit n'a pas de prix défini ou est sur devis. Le paiement en ligne n'est pas possible." });
    }

    // 1. Authentification pour obtenir le token Bearer
    const signature = generateHmac(clientId, clientSecret);
    const apiKeyHeader = `${clientId}:${signature}`;

    console.log("=== AUTHENTIFICATION DJOMY ===");
    const authResponse = await fetch(`${API_URL}/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKeyHeader,
        'X-PARTNER-DOMAIN': partnerDomain,
      }
    });

    if (!authResponse.ok) {
      const authErr = await authResponse.text();
      console.error("Auth error:", authErr);
      return res.status(500).json({ error: 'Erreur authentification Djomy', details: authErr });
    }

    const authData = await authResponse.json();
    const token = authData.data?.token || authData.data?.accessToken;
    if (!token) {
       return res.status(500).json({ error: 'Jeton manquant dans la réponse', details: authData });
    }

    // 2. Préparation du payload exact pour create_payment_gateway
    const djomyPayload = {
      amount: acompteCalcule,
      countryCode: 'GN',
      payerNumber: formatPhoneNumber(payerNumber),
      description: description || "Commande EMROD",
      merchantPaymentReference: merchantPaymentReference || `EMROD-${Date.now()}`,
      returnUrl: `${baseUrl}/payment/success`,
      cancelUrl: `${baseUrl}/payment/cancel`,
      metadata: metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)])) : {}
    };

    console.log("=== REQUÊTE DJOMY GATEWAY ===");
    console.log("Payload :", JSON.stringify(djomyPayload, null, 2));

    // 3. Demande de création du lien de paiement avec Authorization Bearer
    const paymentResponse = await fetch(`${API_URL}/v1/payments/gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKeyHeader,
        'X-PARTNER-DOMAIN': partnerDomain,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(djomyPayload),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error("Payment error:", errorData);
      return res.status(500).json({ error: 'Erreur création paiement Djomy', details: errorData });
    }

    const paymentData = await paymentResponse.json();
    const redirectUrl = paymentData.data?.redirectUrl || paymentData.data?.paymentUrl || paymentData.data?.url;

    return res.status(200).json({
      success: true,
      redirectUrl: redirectUrl,
      transactionId: paymentData.data?.transactionId || paymentData.data?.id
    });

  } catch (error: any) {
    console.error("Erreur générale :", error);
    return res.status(500).json({ error: error.message });
  }
}

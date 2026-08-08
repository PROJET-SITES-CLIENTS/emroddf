import crypto from 'crypto';

// Désactiver le parseur par défaut de Vercel pour récupérer le flux brut (raw body)
// C'est INDISPENSABLE pour garantir que la signature HMAC ne soit pas altérée par le JSON.parse
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
    const signatureHeader = req.headers['x-webhook-signature'];
    if (!signatureHeader) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    if (!clientSecret) throw new Error("Missing Client Secret");

    // Lecture du flux brut (raw body)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');

    // Extraction de la signature (Format: "v1:signature")
    const providedSignature = signatureHeader.replace('v1:', '');

    // Génération de la signature attendue
    const expectedSignature = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex');

    // Validation stricte
    if (providedSignature !== expectedSignature) {
      console.error("Signature invalide! Reçue:", providedSignature, "Attendue:", expectedSignature);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Le payload est authentique, on le parse maintenant
    const parsedBody = JSON.parse(rawBody);
    const { eventType, data, metadata } = parsedBody;

    if (eventType === 'payment.success') {
      const appsScriptUrl = process.env.VITE_APPS_SCRIPT_WEBHOOK_URL;
      
      if (appsScriptUrl) {
        // Validation stricte du montant (Faille de manipulation de prix corrigée)
        const actualPaid = data?.paidAmount || 0;
        const derivedPrice = Math.round(actualPaid / 0.6);

        // Formate les données pour le Apps Script
        const orderData = {
          type: "order",
          nom: metadata?.nom || data?.payerIdentifier || "Client",
          prenom: metadata?.prenom || "",
          telephone: data?.payerIdentifier || metadata?.telephone || "",
          adresse: metadata?.adresse || "Non renseignée",
          produit: metadata?.produit || "Commande en ligne",
          // On ignore le prix envoyé par le client, on force le prix calculé sur l'argent reçu
          prix: `${derivedPrice} GNF (Estimé)`,
          prixNumeric: derivedPrice,
          acompte: `${actualPaid} GNF (Payé via Djomy)`,
          acompteNumeric: actualPaid,
          date: new Date().toISOString()
        };

        const result = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        if (!result.ok) {
          const errorText = await result.text();
          throw new Error(`Apps Script failed with status ${result.status}: ${errorText}`);
        }
        
        console.log("Apps Script Webhook status:", result.status);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}

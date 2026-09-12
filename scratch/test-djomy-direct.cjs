require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function run() {
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain
    // NO AUTHORIZATION BEARER TOKEN
  };

  const payload = {
    amount: 100000,
    countryCode: 'GN',
    payerNumber: '00224623885959',
    allowedPaymentMethods: ['OM', 'MOMO'],
    description: 'Commande EMROD test',
    merchantPaymentReference: `EMROD-${Date.now()}`,
    returnUrl: 'https://emroddf.com/payment/success',
    cancelUrl: 'https://emroddf.com/payment/cancel'
  };

  const res = await fetch(`https://prod-api.djomy.africa/v1/payments/gateway`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  console.log('Status:', res.status, await res.text());
}
run().catch(console.error);

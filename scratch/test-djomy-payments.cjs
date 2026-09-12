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
  };

  const payload = {
    amount: 100000,
    countryCode: 'GN',
    payerNumber: '00224623885959',
    description: 'Commande EMROD test',
    paymentMethod: 'OM'
  };

  const res = await fetch(`https://prod-api.djomy.africa/v1/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  console.log('Status /v1/payments:', res.status);
  console.log('Body:', await res.text());
}
run().catch(console.error);

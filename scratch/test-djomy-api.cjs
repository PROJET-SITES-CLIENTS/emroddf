require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function run() {
  console.log('=== TEST /api/v1/auth ===\n');
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain
  };

  const res = await fetch(`https://prod-api.djomy.africa/api/v1/auth`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

run().catch(console.error);

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

  const urls = [
    'https://api.djomy.africa/v1/auth',
    'https://api.djomy.com/v1/auth',
    'https://prod.djomy.africa/v1/auth'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({}) });
      console.log(`[${url}] Status:`, res.status, await res.text());
    } catch (e) {
      console.log(`[${url}] Error:`, e.message);
    }
  }
}
run().catch(console.error);

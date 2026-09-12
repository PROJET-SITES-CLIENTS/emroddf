require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;
const BASE = 'https://prod-api.djomy.africa';

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function testHeader(headerName) {
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  try {
    const res = await fetch(`${BASE}/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PARTNER-DOMAIN': partnerDomain,
        [headerName]: apiKey
      },
      body: JSON.stringify({})
    });
    const text = await res.text();
    console.log(`[${res.status}] ${headerName}: ${text.includes('Missing') ? '❌ same 401' : '✅ ' + text.substring(0, 50)}`);
  } catch(e) { console.log(`[ERR] ${headerName}`); }
}

async function run() {
  const headers = [
    'X-API-KEY', 'x-api-key', 'X-Api-Key', 'ApiKey', 'apikey', 'API-KEY', 'api-key',
    'X-Auth-Token', 'x-auth-token', 'Authorization', 'Token',
    'DJOMY-API-KEY', 'X-DJOMY-API-KEY', 'clientId'
  ];
  for (const h of headers) {
    await testHeader(h);
    await new Promise(r => setTimeout(r, 100));
  }
}

run().catch(console.error);

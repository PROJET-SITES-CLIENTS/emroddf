require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;
const BASE = 'https://prod-api.djomy.africa';

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function run() {
  console.log('=== TEST ENCODAGE ===\n');
  const sig = hmac(clientId, clientSecret);
  const plainKey = `${clientId}:${sig}`;
  const base64Key = Buffer.from(plainKey).toString('base64');
  
  const variations = [
    { name: 'Plain', val: plainKey },
    { name: 'Base64', val: base64Key },
    { name: 'Basic Base64', auth: `Basic ${base64Key}` },
    { name: 'Bearer Base64', auth: `Bearer ${base64Key}` },
    { name: 'Basic plain', auth: `Basic ${plainKey}` } // Without base64
  ];

  for (const v of variations) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-PARTNER-DOMAIN': partnerDomain
      };
      if (v.val) headers['X-API-KEY'] = v.val;
      if (v.auth) headers['Authorization'] = v.auth;

      const res = await fetch(`${BASE}/v1/auth`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      const text = await res.text();
      console.log(`[${res.status}] ${v.name}: ${text.includes('Missing') ? '❌ same 401' : '✅ ' + text.substring(0, 100)}`);
    } catch (e) {
      console.error(`[ERR] ${v.name}: ${e.message}`);
    }
  }
}

run().catch(console.error);

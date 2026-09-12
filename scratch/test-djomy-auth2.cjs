require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = (process.env.DJOMY_CLIENT_ID || '').trim();
const clientSecret = (process.env.DJOMY_CLIENT_SECRET || '').trim();
const partnerDomain = (process.env.DJOMY_PARTNER_DOMAIN || '').trim();
const BASE = 'https://prod-api.djomy.africa';

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function run() {
  console.log('=== TEST AVEC TRIM ET MINUSCULES ===\n');
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  
  const variations = [
    { 'X-API-KEY': apiKey, 'X-PARTNER-DOMAIN': partnerDomain },
    { 'x-api-key': apiKey, 'x-partner-domain': partnerDomain },
    { 'X-Api-Key': apiKey, 'X-Partner-Domain': partnerDomain },
    { 'Authorization': `X-API-KEY ${apiKey}`, 'X-PARTNER-DOMAIN': partnerDomain },
    { 'Authorization': `Bearer ${apiKey}`, 'X-PARTNER-DOMAIN': partnerDomain },
    { 'Authorization': apiKey, 'X-PARTNER-DOMAIN': partnerDomain },
    { 'X-API-KEY': apiKey } // sans partner domain
  ];

  for (let i = 0; i < variations.length; i++) {
    try {
      const res = await fetch(`${BASE}/v1/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...variations[i]
        },
        body: JSON.stringify({})
      });
      const text = await res.text();
      const isSame = text.includes('Missing');
      console.log(`Test ${i + 1} (${Object.keys(variations[i]).join(', ')}): ${isSame ? '❌ same 401' : '✅ ' + text.substring(0, 100)}`);
    } catch (e) {
      console.error(`Test ${i + 1} failed: ${e.message}`);
    }
  }
}

run().catch(console.error);

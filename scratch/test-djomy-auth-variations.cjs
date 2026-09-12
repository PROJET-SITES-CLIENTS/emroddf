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
  
  const variations = [
    { name: 'Authorization: ApiKey', headers: { 'Authorization': `ApiKey ${apiKey}`, 'X-PARTNER-DOMAIN': partnerDomain } },
    { name: 'Authorization: APIKey', headers: { 'Authorization': `APIKey ${apiKey}`, 'X-PARTNER-DOMAIN': partnerDomain } },
    { name: 'Authorization: key', headers: { 'Authorization': `key ${apiKey}`, 'X-PARTNER-DOMAIN': partnerDomain } }
  ];

  for (const v of variations) {
    const res = await fetch(`https://prod-api.djomy.africa/v1/auth`, {
      method: 'POST',
      headers: { ...v.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log(`[${res.status}] ${v.name}:`, await res.text());
  }
}
run().catch(console.error);

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
  
  // Testing the typo in the documentation literally
  const apiKey1 = `${clientId}>:${sig}`;
  const apiKey2 = `${clientId}>${sig}`;
  const apiKey3 = `<${clientId}>:<${sig}>`;

  for (const apiKey of [apiKey1, apiKey2, apiKey3]) {
    const res = await fetch(`https://prod-api.djomy.africa/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-PARTNER-DOMAIN': partnerDomain
      },
      body: JSON.stringify({})
    });
    console.log('Tested:', apiKey);
    console.log('Status:', res.status, await res.text());
  }
}
run().catch(console.error);

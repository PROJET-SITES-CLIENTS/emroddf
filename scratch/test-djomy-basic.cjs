require('dotenv').config({ path: __dirname + '/../.env' });
const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const BASE = 'https://prod-api.djomy.africa';
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

async function testBasic(user, pass, label) {
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  try {
    const res = await fetch(`${BASE}/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${token}`,
        'X-PARTNER-DOMAIN': partnerDomain
      },
      body: JSON.stringify({})
    });
    console.log(`[${res.status}] ${label}: ${await res.text()}`);
  } catch(e) { console.log(`[ERR] ${label}: ${e.message}`); }
}

async function run() {
  await testBasic(clientId, clientSecret, 'clientId : clientSecret');
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256', clientSecret).update(clientId).digest('hex');
  await testBasic(clientId, sig, 'clientId : HMAC');
  
  // What if the username is the partner domain?
  await testBasic(partnerDomain, clientSecret, 'partnerDomain : clientSecret');
  await testBasic(partnerDomain, sig, 'partnerDomain : HMAC');
}

run().catch(console.error);

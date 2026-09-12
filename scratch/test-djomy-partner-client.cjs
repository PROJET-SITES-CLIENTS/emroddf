require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function run() {
  console.log('=== TEST AVEC PARTNER DOMAIN COMME CLIENT ID ===\n');
  const clientId = partnerDomain; // Trying partner domain as clientId
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain
  };

  try {
    const res = await fetch(`https://prod-api.djomy.africa/v1/auth`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (e) { console.log(e.message); }
}

run().catch(console.error);

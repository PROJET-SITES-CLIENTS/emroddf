require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;
const BASE = 'https://prod-api.djomy.africa';

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function testAuth(label, headers, body) {
  try {
    const res = await fetch(`${BASE}/v1/auth`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    console.log(`[${res.status}] ${label}: ${text.includes('Missing') ? '❌ same 401' : '✅ DIFFÉRENT → ' + text.substring(0,200)}`);
  } catch (e) {
    console.error(`[ERR] ${label}:`, e.message);
  }
}

async function run() {
  console.log('=== TEST VARIATIONS /v1/auth ===\n');
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  const baseHeaders = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain
  };

  await testAuth('1. Standard doc', baseHeaders, {});
  await testAuth('2. Body null', baseHeaders, null);
  await testAuth('3. Credentials in body', baseHeaders, { clientId, clientSecret });
  await testAuth('4. client_id / client_secret in body', baseHeaders, { client_id: clientId, client_secret: clientSecret });
  
  // Test if X-API-KEY is expected as a Bearer token
  await testAuth('5. Bearer X-API-KEY', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-PARTNER-DOMAIN': partnerDomain
  }, {});
  
  // Test Basic auth
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  await testAuth('6. Basic Auth', {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
    'X-PARTNER-DOMAIN': partnerDomain
  }, {});
  
  // Test ApiKey auth
  await testAuth('7. ApiKey Auth', {
    'Content-Type': 'application/json',
    'Authorization': `ApiKey ${apiKey}`,
    'X-PARTNER-DOMAIN': partnerDomain
  }, {});
}

run().catch(console.error);

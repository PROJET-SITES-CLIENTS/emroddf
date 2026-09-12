require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const BASE = 'https://prod-api.djomy.africa';
const PARTNER_DOMAIN = '7a3fcc9009412faf7048910aa026502b9564894bcc2862cd96b369fb5d7a7cb6';

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function testAuth(extraHeaders, label) {
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  const res = await fetch(`${BASE}/v1/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey, ...extraHeaders },
    body: JSON.stringify({})
  });
  const text = await res.text();
  const ok = res.status !== 401 || !text.includes('Missing');
  console.log(`[${res.status}] ${label}: ${ok ? '✅ DIFFÉRENT → ' + text.substring(0,200) : '❌ same 401'}`);
}

async function run() {
  console.log('=== TESTS NOMS DU HEADER PARTNER ===\n');

  await testAuth({ 'X-PARTNER-DOMAIN': PARTNER_DOMAIN }, 'X-PARTNER-DOMAIN');
  await testAuth({ 'x-partner-domain': PARTNER_DOMAIN }, 'x-partner-domain (lowercase)');
  await testAuth({ 'X-Partner-Domain': PARTNER_DOMAIN }, 'X-Partner-Domain');
  await testAuth({ 'X-DOMAIN': PARTNER_DOMAIN }, 'X-DOMAIN');
  await testAuth({ 'X-Domain-Key': PARTNER_DOMAIN }, 'X-Domain-Key');
  await testAuth({ 'X-PARTNER-KEY': PARTNER_DOMAIN }, 'X-PARTNER-KEY');
  await testAuth({ 'X-Partner-Key': PARTNER_DOMAIN }, 'X-Partner-Key');
  await testAuth({ 'X-APP-KEY': PARTNER_DOMAIN }, 'X-APP-KEY');
  await testAuth({ 'X-Application-Key': PARTNER_DOMAIN }, 'X-Application-Key');
  await testAuth({ 'X-Client-Domain': PARTNER_DOMAIN }, 'X-Client-Domain');
  
  // Peut-être que la valeur doit être utilisée différemment
  // Peut-être que c'est la valeur du X-API-KEY elle-même qui doit être la partner key
  const sig = hmac(clientId, clientSecret);
  const res2 = await fetch(`${BASE}/v1/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': PARTNER_DOMAIN // Partner domain AS the API key
    },
    body: JSON.stringify({})
  });
  console.log(`[${res2.status}] PARTNER_DOMAIN as X-API-KEY: ${(await res2.text()).substring(0,200)}`);
  
  // Ou peut-être que X-API-KEY = clientId:partnerDomain:signature
  const res3 = await fetch(`${BASE}/v1/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': `${clientId}:${PARTNER_DOMAIN}:${sig}`
    },
    body: JSON.stringify({})
  });
  console.log(`[${res3.status}] clientId:PARTNER:sig in X-API-KEY: ${(await res3.text()).substring(0,200)}`);
}

run().catch(console.error);

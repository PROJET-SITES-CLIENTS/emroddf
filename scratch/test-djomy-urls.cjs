require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');

async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const text = await res.text();
    console.log(`[${res.status}] ${url}: ${text.substring(0, 100)}`);
  } catch(e) {
    console.log(`[ERR] ${url}: ${e.message}`);
  }
}

async function run() {
  await testUrl('https://api.djomy.africa/v1/auth');
  await testUrl('https://partner-api.djomy.africa/v1/auth');
  await testUrl('https://gateway.djomy.africa/v1/auth');
  await testUrl('https://v1.djomy.africa/auth');
  await testUrl('https://prod-api.djomy.africa/auth');
  await testUrl('https://prod.djomy.africa/v1/auth');
}
run().catch(console.error);

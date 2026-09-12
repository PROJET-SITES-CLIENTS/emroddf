import crypto from 'crypto';
import fetch from 'node-fetch'; 

const clientId = "djomy-client-1784976340748-c956";
const clientSecret = "s3cr3t-zei3iUnZM88Xi4Uo-siyWnRFVm3IV96-";

function generateHmac(stringToSign, secret) {
  return crypto.createHmac('sha256', secret).update(stringToSign).digest('hex');
}

async function tryAuth(headerValue, desc) {
  try {
    const authResponse = await fetch('https://prod-api.djomy.africa/v1/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': headerValue
      },
      body: JSON.stringify({}),
    });
    console.log(`${desc} -> ${authResponse.status}`);
    if (authResponse.status !== 401) {
        console.log("Success with body:", await authResponse.text());
    }
  } catch (err) { }
}

async function testAll() {
  const signature = generateHmac(clientId, clientSecret);
  
  await tryAuth(`${clientId}:${signature}`, "Colon separator");
  await tryAuth(`${clientId}.${signature}`, "Dot separator");
  await tryAuth(`${clientId}${signature}`, "Concatenated");
  await tryAuth(`${signature}`, "Only signature");
  await tryAuth(`Bearer ${signature}`, "Bearer signature");
  await tryAuth(`Basic ${Buffer.from(clientId + ':' + signature).toString('base64')}`, "Basic auth base64");

  // Try swapped hmac
  const swappedSig = crypto.createHmac('sha256', clientId).update(clientSecret).digest('hex');
  await tryAuth(`${clientId}:${swappedSig}`, "Swapped HMAC Colon separator");
}

testAll();

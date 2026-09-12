require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('crypto');
const https = require('https');

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

function hmac(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

async function run() {
  const sig = hmac(clientId, clientSecret);
  const apiKey = `${clientId}:${sig}`;
  const data = JSON.stringify({});

  const options = {
    hostname: 'prod-api.djomy.africa',
    port: 443,
    path: '/v1/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'X-API-KEY': apiKey,
      'X-PARTNER-DOMAIN': partnerDomain
    }
  };

  const req = https.request(options, res => {
    let raw = '';
    res.on('data', d => raw += d);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', raw);
    });
  });

  req.on('error', e => console.error(e));
  req.write(data);
  req.end();
}
run();

const fetch = require('node-fetch');
const crypto = require('crypto');
const clientId = 'djomy-client-1784976340748-c956';
const clientSecret = 's3cr3t-zei3iUnZM88Xi4Uo-siyWnRFVm3IV96-';
const sig = crypto.createHmac('sha256', clientSecret).update(clientId).digest('hex');

const originsToTest = [
  'https://emroddf.com',
  'http://emroddf.com',
  'https://www.emroddf.com',
  'http://www.emroddf.com',
  'emroddf.com',
  'https://emroddf.com/'
];

async function run() {
  for (const origin of originsToTest) {
    const res = await fetch('https://prod-api.djomy.africa/v1/payments/gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': clientId + ':' + sig,
        'Origin': origin
      },
      body: JSON.stringify({ amount: 100 })
    });
    console.log(origin, '->', res.status, await res.text());
  }
}
run();

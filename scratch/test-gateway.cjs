const fetch = require('node-fetch');
const crypto = require('crypto');
const clientId = 'djomy-client-1784976340748-c956';
const clientSecret = 's3cr3t-zei3iUnZM88Xi4Uo-siyWnRFVm3IV96-';
const sig = crypto.createHmac('sha256', clientSecret).update(clientId).digest('hex');

fetch('https://prod-api.djomy.africa/v1/payments/gateway', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': clientId + ':' + sig,
    'Origin': 'https://emroddf.com',
    'Referer': 'https://emroddf.com/'
  },
  body: JSON.stringify({
    amount: 100,
    currency: 'XOF',
    merchantPaymentReference: 'test-123',
    successRedirectUrl: 'https://emroddf.com/success',
    failedRedirectUrl: 'https://emroddf.com/failed'
  })
}).then(async res => {
  console.log(res.status);
  console.log(await res.text());
}).catch(console.error);

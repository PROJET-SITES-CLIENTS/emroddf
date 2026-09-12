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
  const apiKey = `${clientId}:${sig}`;
  
  const headersAuth = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain
  };

  const authRes = await fetch(`https://api.djomy.africa/v1/auth`, {
    method: 'POST',
    headers: headersAuth,
    body: JSON.stringify({})
  });
  
  const authData = await authRes.json();
  console.log('Auth Status:', authRes.status);
  
  if (!authData.data || !authData.data.accessToken) {
    console.log('No access token!', authData);
    return;
  }
  
  const token = authData.data.accessToken;

  const headersPayment = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain,
    'Authorization': `Bearer ${token}`
  };

  const payload = {
    amount: 100000,
    countryCode: 'GN',
    payerNumber: '00224623885959',
    description: 'Commande EMROD test',
    merchantPaymentReference: `EMROD-${Date.now()}`,
    returnUrl: 'https://emroddf.com/payment/success',
    cancelUrl: 'https://emroddf.com/payment/cancel'
  };

  const paymentRes = await fetch(`https://api.djomy.africa/v1/payments/gateway`, {
    method: 'POST',
    headers: headersPayment,
    body: JSON.stringify(payload)
  });
  
  console.log('Payment Status:', paymentRes.status);
  console.log('Payment Body:', await paymentRes.text());
}
run().catch(console.error);

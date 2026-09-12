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
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-PARTNER-DOMAIN': partnerDomain
  };

  const basePayload = {
    amount: 100000,
    countryCode: 'GN',
    payerNumber: '00224623885959',
    description: 'Commande EMROD test',
    returnUrl: 'https://emroddf.com/payment/success',
    cancelUrl: 'https://emroddf.com/payment/cancel'
  };

  // Test which reference field is the correct one
  const referenceFields = [
    'merchantPaymentReference',
    'merchantReference',
    'reference',
    'paymentReference',
    'orderId',
    'transactionReference'
  ];

  for (const field of referenceFields) {
    const payload = { ...basePayload, [field]: 'EMROD-123' };
    const res = await fetch(`https://prod-api.djomy.africa/v1/payments/gateway`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Testing ${field}:`, text.includes('La reference') ? '❌ Reference error' : '✅ NO reference error');
  }
}
run().catch(console.error);

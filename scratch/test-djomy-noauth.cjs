require('dotenv').config({ path: __dirname + '/../.env' });

const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

async function run() {
  const headers = {
    'Content-Type': 'application/json',
    'X-PARTNER-DOMAIN': partnerDomain
    // NO X-API-KEY
  };

  const payload = {
    amount: 100000,
    countryCode: 'GN',
    payerNumber: '00224623885959',
    description: 'Commande EMROD test',
    transactionReference: 'EMROD-12345',
    returnUrl: 'https://emroddf.com/payment/success',
    cancelUrl: 'https://emroddf.com/payment/cancel'
  };

  const res = await fetch(`https://prod-api.djomy.africa/v1/payments/gateway`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  console.log('Status no auth:', res.status);
  console.log('Body:', await res.text());
}
run().catch(console.error);

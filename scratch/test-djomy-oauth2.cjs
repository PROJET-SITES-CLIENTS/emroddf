require('dotenv').config({ path: __dirname + '/../.env' });

const clientId = process.env.DJOMY_CLIENT_ID;
const clientSecret = process.env.DJOMY_CLIENT_SECRET;
const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;

async function run() {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${token}`,
    'X-PARTNER-DOMAIN': partnerDomain
  };

  const body = new URLSearchParams({
    grant_type: 'client_credentials'
  });

  const res = await fetch(`https://prod-api.djomy.africa/v1/auth`, {
    method: 'POST',
    headers,
    body
  });
  
  console.log('Status OAuth2:', res.status);
  console.log('Body:', await res.text());
}

run().catch(console.error);

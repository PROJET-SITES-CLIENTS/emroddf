const crypto = require('crypto');
const { execSync } = require('child_process');

const clientId = 'djomy-client-1784976340748-c956';
const clientSecret = 's3cr3t-zei3iUnZM88Xi4Uo-siyWnRFVm3IV96-Djomy';
const sig = crypto.createHmac('sha256', clientSecret).update(clientId).digest('hex');

const cmd = `curl.exe -s -X POST https://prod-api.djomy.africa/v1/auth -H "X-API-KEY: ${clientId}:${sig}" -H "Content-Type: application/json" -d "{}"`;
try {
  console.log(execSync(cmd).toString());
} catch(e) {
  console.log("Error:", e.stdout.toString());
}

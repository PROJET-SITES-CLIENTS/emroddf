const { execSync } = require('child_process');
const crypto = require('crypto');
const clientId = 'djomy-client-1784976340748-c956';
const clientSecret = 's3cr3t-zei3iUnZM88Xi4Uo-siyWnRFVm3IV96-';
const sig = crypto.createHmac('sha256', clientSecret).update(clientId).digest('hex');
const b64 = Buffer.from(clientId + ':' + sig).toString('base64');
const cmd = `curl.exe -s -X POST https://sandbox-api.djomy.africa/v1/auth -H "Authorization: Basic ${b64}" -H "X-API-KEY: ${clientId}:${sig}" -H "Content-Type: application/json" -d "{}"`;
try { console.log(execSync(cmd).toString()); } catch(e) { console.log(e.stdout ? e.stdout.toString() : e); }

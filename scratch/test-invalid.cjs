const { execSync } = require('child_process');
const cmd = `curl.exe -s -X POST https://prod-api.djomy.africa/v1/auth -H "X-API-KEY: invalid:invalid" -H "Content-Type: application/json" -d "{}"`;
try {
  console.log(execSync(cmd).toString());
} catch(e) {
  console.log("Error:", e.stdout.toString());
}

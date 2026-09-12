const { execSync } = require('child_process');
const cmd = `curl.exe -s -o /dev/null -w "%{http_code}" -X POST https://api.djomy.africa/v1/auth -H "Origin: https://emroddf.com" -H "Referer: https://emroddf.com/" -H "User-Agent: Mozilla/5.0" -H "Content-Type: application/json" -d "{}"`;
try {
  console.log(execSync(cmd).toString());
} catch(e) {
  console.log("Error:", e.stdout.toString());
}

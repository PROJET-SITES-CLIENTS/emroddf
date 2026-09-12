const fetch = require('node-fetch');
fetch('https://api.djomy.africa/v1/auth', {
  method: 'POST',
  headers: {
    'Origin': 'https://emroddf.com',
    'Referer': 'https://emroddf.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
}).then(async res => {
  console.log(res.status);
  console.log(await res.text());
}).catch(console.error);

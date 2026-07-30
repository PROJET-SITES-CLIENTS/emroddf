const fetch = require('node-fetch'); // we'll just use global fetch in Node 20
const API_KEY = "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";
const FILE_ID = "1J2fbOXNkJnMXhnd79VwHk-VKBUp7uSm9"; // example logo image

async function test() {
  const url = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media&key=${API_KEY}`;
  const res = await fetch(url, {
    headers: {
      'Origin': 'http://localhost:3000'
    }
  });
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get('content-type'));
  console.log("CORS Allow Origin:", res.headers.get('access-control-allow-origin'));
  if (!res.ok) {
    const text = await res.text();
    console.log("Error body:", text.substring(0, 200));
  }
}
test();

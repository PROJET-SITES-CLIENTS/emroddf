const fetch = require('node-fetch');
const API_KEY = "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";
const GALLERY_FOLDER_ID = "14FAzo-gy1WKjCxEFcXEWhVzhfvPqYx2X";

async function test() {
  const url = `https://www.googleapis.com/drive/v3/files?q='${GALLERY_FOLDER_ID}'+in+parents&fields=files(id,name,mimeType)&key=${API_KEY}`;
  const res = await fetch(url, { headers: { 'Origin': 'http://localhost:3000' } });
  console.log("Status:", res.status);
  console.log("CORS Allow Origin:", res.headers.get('access-control-allow-origin'));
  if (res.ok) {
    const data = await res.json();
    console.log("Files:", data.files.length);
  } else {
    console.log("Error:", await res.text());
  }
}
test();

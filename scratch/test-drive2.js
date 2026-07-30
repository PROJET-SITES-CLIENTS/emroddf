const API_KEY = "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";

async function fetchDriveFiles(query, fields) {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.files || [];
}

async function run() {
  const cuisineId = "1IOGGbJkZUCopPa_D6Ncyja4ylH0y7Fb8";
  const files = await fetchDriveFiles(`'${cuisineId}' in parents and trashed = false`, "files(id, name, mimeType)");
  console.log("All files in CUISINE:", files);
  
  const meubleTvId = "1eKMLN90se1AcF6KS6Ym_c7lZ37thCTrE";
  const tvFiles = await fetchDriveFiles(`'${meubleTvId}' in parents and trashed = false`, "files(id, name, mimeType)");
  console.log("All files in MEUBLE TV:", tvFiles);
}

run().catch(console.error);

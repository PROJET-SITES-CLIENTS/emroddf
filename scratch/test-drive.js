const API_KEY = "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";
const FURNITURE_FOLDER_ID = "1yisVYsJBiyyYeP9DEg8d-BbXxPJ0Hwju";

async function fetchDriveFiles(query, fields) {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.files || [];
}

async function run() {
  console.log("Fetching categories in", FURNITURE_FOLDER_ID);
  const categories = await fetchDriveFiles(`'${FURNITURE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, "files(id, name)");
  console.log("Categories:", categories);

  for (const cat of categories) {
    console.log(`\nFetching products in category: ${cat.name}`);
    const products = await fetchDriveFiles(`'${cat.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, "files(id, name)");
    console.log(`Products in ${cat.name}:`, products);

    for (const prod of products) {
      const images = await fetchDriveFiles(`'${prod.id}' in parents and mimeType contains 'image/' and trashed = false`, "files(id, name)");
      console.log(`  Images in ${prod.name}:`, images.length);
    }
  }
}

run().catch(console.error);

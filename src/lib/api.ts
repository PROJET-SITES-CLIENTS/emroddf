// Configuration
const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";
const GALLERY_IMAGES_FOLDER_ID = "1N01xW4mbQ4caTOI-CAk9t8swCWMhuxGx";
const GALLERY_VIDEOS_FOLDER_ID = "1GPCLj9JT5sn5xD8QN_YwiJI1DWp7FqTh";
const FURNITURE_FOLDER_ID = "1yisVYsJBiyyYeP9DEg8d-BbXxPJ0Hwju";
const CATALOG_FOLDER_ID = "1swy2CyqOCK10f2GpWTmrMG3VsUA55UGL";
const WEBHOOK_URL = import.meta.env.VITE_APPS_SCRIPT_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxnz3h22y15JAenZiJ98QHN601m2yP0bE_wcaUxGc7PgF5pbETIP7Vqc0WWOEpRFv5q/exec";

// Types
export interface Product {
  folderId: string;
  name: string;
  category: string;
  categorySlug: string;
  modelSlug: string;
  mainImageId: string | null;
  prix: string;
  prixNumeric: number;
  description: string;
  dimensions?: string;
  finition?: string;
  essence?: string;
  imageCount: number;
}

export interface GalleryImage {
  id: string;
  name: string;
  mimeType: string;
}

// Helpers
export function slugify(text: string): string {
  if (!text) return "";
  return text.toString().toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
function parseMeta(description = ""): { prix: string; prixNumeric: number; description: string; dimensions?: string; finition?: string; essence?: string } {
  const raw = (description || "").trim();
  if (!raw) return { prix: "", prixNumeric: 0, description: "" };

  try {
    const meta = JSON.parse(raw);
    const prixStr = String(meta.prix || "");
    const prixNumeric = parseFloat(prixStr.replace(/[^\d]/g, "")) || 0;
    return { 
      prix: prixStr, 
      prixNumeric, 
      description: String(meta.description || ""),
      dimensions: meta.dimensions,
      finition: meta.finition,
      essence: meta.essence
    };
  } catch {}

  const meta: any = { prix: "", prixNumeric: 0, description: "", dimensions: "", finition: "", essence: "" };
  let currentKey = "description";
  
  const lines = raw.split('\n');
  for (const line of lines) {
    const match = line.match(/^([^:]+)[:\-]\s*(.*)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      
      if (key === 'prix') { meta.prix = val; meta.prixNumeric = parseFloat(val.replace(/[^\d]/g, "")) || 0; currentKey = 'prix'; }
      else if (key === 'description') { meta.description = val; currentKey = 'description'; }
      else if (key === 'dimensions') { meta.dimensions = val; currentKey = 'dimensions'; }
      else if (key === 'finition') { meta.finition = val; currentKey = 'finition'; }
      else if (key === 'essence' || key === 'bois') { meta.essence = val; currentKey = 'essence'; }
      else {
        // Unknown key, just append to description if it's multiline text
        if (currentKey === 'description') meta.description += (meta.description ? '\n' : '') + line;
      }
    } else {
      if (currentKey === 'description') {
        meta.description += (meta.description ? '\n' : '') + line;
      }
    }
  }

  // Fallback for description if nothing was parsed
  if (!meta.description && !meta.prix && !meta.dimensions && !meta.finition && !meta.essence) {
    meta.description = raw;
  }

  return meta;
}

// Drive API Fetcher
async function fetchDriveFiles(query: string, fields: string) {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Drive API Error: ${response.status}`);
  const data = await response.json();
  return data.files || [];
}

// Exported Functions

// Caches in-memory to prevent re-fetching on page navigation
let galleryImagesCache: GalleryImage[] | null = null;
let galleryVideosCache: GalleryImage[] | null = null;
let catalogueCache: Product[] | null = null;
let catalogUrlCache: string | null = null;
let categoriesCache: string[] | null = null;

/**
 * Returns the direct URL to display an image from Google Drive.
 */
export function getImageUrl(fileId: string) {
  // Use the thumbnail API which is much more reliable for embedding images and doesn't trigger 403 as often
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

export async function fetchCatalogUrl(): Promise<string | null> {
  if (catalogUrlCache) return catalogUrlCache;
  try {
    const q = `'${CATALOG_FOLDER_ID}' in parents and mimeType = 'application/pdf' and trashed = false`;
    const fields = "files(id, name, webContentLink)";
    const files = await fetchDriveFiles(q, fields);
    if (files.length > 0) {
      catalogUrlCache = files[0].webContentLink || `https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media&key=${API_KEY}`;
      return catalogUrlCache;
    }
    return null;
  } catch (error) {
    console.error("Error fetching catalog from Google Drive", error);
    return null;
  }
}

export async function fetchCategoriesList(): Promise<string[]> {
  if (categoriesCache) return categoriesCache;
  const categoryQuery = `'${FURNITURE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const categories = await fetchDriveFiles(categoryQuery, "files(id, name)");
  categoriesCache = categories.map((c: any) => c.name);
  return categoriesCache;
}

export async function fetchGalleryImages(): Promise<GalleryImage[]> {
  if (galleryImagesCache) return galleryImagesCache;
  const q = `'${GALLERY_IMAGES_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`;
  const fields = "files(id, name, mimeType)";
  galleryImagesCache = await fetchDriveFiles(q, fields);
  return galleryImagesCache || [];
}

export async function fetchGalleryVideos(): Promise<GalleryImage[]> {
  if (galleryVideosCache) return galleryVideosCache;
  const q = `'${GALLERY_VIDEOS_FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`;
  const fields = "files(id, name, mimeType)";
  galleryVideosCache = await fetchDriveFiles(q, fields);
  return galleryVideosCache || [];
}

export async function fetchCatalogue(): Promise<Product[]> {
  if (catalogueCache) return catalogueCache;
  
  // 1. List Category folders inside FURNITURE_FOLDER_ID
  const categoryQuery = `'${FURNITURE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const categories = await fetchDriveFiles(categoryQuery, "files(id, name)");
  
  // Mettre à jour le cache des catégories pendant qu'on y est
  if (!categoriesCache) {
    categoriesCache = categories.map((c: any) => c.name);
  }

  const products: Product[] = [];
  const categoryChunkSize = 3;
  const productChunkSize = 5;

  // Process categories in chunks
  for (let i = 0; i < categories.length; i += categoryChunkSize) {
    const catChunk = categories.slice(i, i + categoryChunkSize);
    
    const catPromises = catChunk.map(async (category: any) => {
      // 2. List Product folders inside each Category
      const productQuery = `'${category.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const productFolders = await fetchDriveFiles(productQuery, "files(id, name)");
      
      const catProducts: Product[] = [];
      
      // Process products in chunks
      for (let j = 0; j < productFolders.length; j += productChunkSize) {
        const prodChunk = productFolders.slice(j, j + productChunkSize);
        const prodPromises = prodChunk.map(async (productFolder: any) => {
          // 3. Get images inside Product folder
          const q = `'${productFolder.id}' in parents and mimeType contains 'image/' and trashed = false`;
          const files = await fetchDriveFiles(q, "files(id, name, description)");
          
          if (files.length === 0) return null;
          
          const mainImage = files.find((f: any) => (f.description || "").trim()) || files[0];
          const meta = parseMeta(mainImage?.description || "");

          return {
            folderId: productFolder.id,
            name: productFolder.name,
            category: category.name,
            categorySlug: slugify(category.name),
            modelSlug: slugify(productFolder.name),
            mainImageId: mainImage?.id ?? null,
            prix: meta.prix,
            prixNumeric: meta.prixNumeric,
            description: meta.description,
            dimensions: meta.dimensions,
            finition: meta.finition,
            essence: meta.essence,
            imageCount: files.length,
          } as Product;
        });
        
        const results = await Promise.all(prodPromises);
        catProducts.push(...results.filter((p: any) => p !== null) as Product[]);
      }
      return catProducts;
    });
    
    const chunkResults = await Promise.all(catPromises);
    chunkResults.forEach((res: any) => products.push(...res));
  }

  catalogueCache = products;
  return products;
}

export async function fetchProductDetail(categorySlug: string, modelSlug: string) {
  // On récupère tout le catalogue (utilisera le cache si déjà chargé)
  const catalogue = await fetchCatalogue();
  const product = catalogue.find(p => p.categorySlug === categorySlug && p.modelSlug === modelSlug);
  
  if (!product) {
    throw new Error("Produit introuvable");
  }

  // Get all images inside this specific folder
  const q = `'${product.folderId}' in parents and mimeType contains 'image/' and trashed = false`;
  const files = await fetchDriveFiles(q, "files(id, name, description)");

  return {
    ...product,
    images: files.map((f: any) => {
      const meta = parseMeta(f.description || "");
      return { 
        id: f.id, 
        name: f.name,
        prix: meta.prix,
        prixNumeric: meta.prixNumeric,
        description: meta.description,
        dimensions: meta.dimensions,
        finition: meta.finition,
        essence: meta.essence
      };
    }),
  };
}

export async function submitLead(data: any) {
  if (!WEBHOOK_URL) return;
  const payload = {
    type: "lead",
    ...data,
    date: new Date().toISOString()
  };
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script accepts text/plain to avoid CORS preflight issues sometimes, but works with JSON too.
    body: JSON.stringify(payload),
    // Use no-cors to prevent browser from blocking if the Apps Script doesn't return CORS headers
    mode: "no-cors"
  });
}

export async function submitOrder(data: any) {
  if (!WEBHOOK_URL) return;
  const payload = {
    type: "order",
    ...data,
    date: new Date().toISOString()
  };
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    mode: "no-cors"
  });
}

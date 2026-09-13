// ══════════════════════════════════════════════════════════════════
// Couche d'accès données du site public.
// Toutes les données proviennent des API serverless (/api/public/*)
// adossées à Neon PostgreSQL + Vercel Blob — plus aucune dépendance
// Google Drive ou Apps Script.
// ══════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────
export type DepositMode = 'percent' | 'fixed' | 'none';

export interface Product {
  id: number;
  name: string;
  category: string;
  categorySlug: string;
  sectionName: string;
  sectionSlug: string;
  modelSlug: string;
  mainImageUrl: string | null;
  prix: string;
  prixNumeric: number;
  description: string;
  dimensions?: string;
  finition?: string;
  essence?: string;
  depositMode: DepositMode;
  depositValue: number;
  imageCount: number;
  videoCount: number;
}

export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentName: string | null;
  parentSlug: string | null;
  productCount: number;
}

export interface GalleryMedia {
  id: number;
  media_type: 'image' | 'video';
  url: string;
  title: string;
}

export interface SiteSettings {
  contact: {
    address: string;
    phones: string[];
    whatsapp: string;
    emails: string[];
    hours: string;
    hoursShort: string;
  };
  home: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    cta1Label: string;
    cta2Label: string;
    heroImages: string[];
    marquee: string[];
    stats: { value: number; suffix: string; label: string }[];
    values: { title: string; text: string }[];
    signatureParagraphs: string[];
    realisations: string[];
  };
  testimonials: { text: string; author: string; role: string }[];
  partners: string[];
  faq: { q: string; a: string }[];
  faqContact: { q: string; a: string }[];
  about: {
    paragraphs: string[];
    quote: string;
    steps: { title: string; desc: string }[];
  };
  catalogPdf: { url: string };
  seo: { title: string; description: string };
  payment: { depositRate: number };
}

// ── Helpers ────────────────────────────────────────────────────────
export function slugify(text: string): string {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/** Une vidéo est lue en <video> si l'URL pointe vers un fichier, sinon embed */
export function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('.blob.');
}

/**
 * Calcule le montant d'acompte (GNF) affiché au client.
 * Même logique que api/_lib/deposit.ts (source de vérité côté serveur).
 * @returns montant en GNF, ou null si paiement en ligne désactivé.
 */
export function computeDeposit(
  priceTotal: number,
  mode: DepositMode | string,
  value: number
): number | null {
  if (mode === 'none') return null;
  if (mode === 'fixed') {
    const amount = Math.round(Number(value) || 0);
    return amount > 0 ? amount : null;
  }
  const percent = Math.min(Math.max(Number(value) || 0, 0), 100);
  if (percent <= 0) return null;
  const price = Number(priceTotal) || 0;
  if (price <= 0) return null;
  return Math.round((price * percent) / 100);
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

// ── Caches mémoire (évitent les re-fetch à la navigation) ─────────
let catalogueCache: { categories: CategoryInfo[]; products: Product[] } | null = null;
let galleryCache: { images: GalleryMedia[]; videos: GalleryMedia[] } | null = null;
let settingsCache: SiteSettings | null = null;

// ── Catalogue ──────────────────────────────────────────────────────
export async function fetchCatalogue(): Promise<Product[]> {
  const data = await fetchCatalogueFull();
  return data.products;
}

export async function fetchCatalogueFull(): Promise<{ categories: CategoryInfo[]; products: Product[] }> {
  if (catalogueCache) return catalogueCache;
  const data = await getJson<{ categories: CategoryInfo[]; products: Product[] }>('/api/public/catalogue');
  catalogueCache = data;
  return data;
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const data = await fetchCatalogueFull();
  return data.categories;
}

export async function fetchProductDetail(categorySlug: string, modelSlug: string) {
  const data = await getJson<{
    id: number;
    name: string;
    category: string;
    categorySlug: string;
    modelSlug: string;
    prix: string;
    prixNumeric: number;
    description: string;
    dimensions: string;
    finition: string;
    essence: string;
    depositMode: DepositMode;
    depositValue: number;
    images: { id: number; url: string; mediaType: 'image' | 'video' }[];
  }>(`/api/public/product/${encodeURIComponent(categorySlug)}/${encodeURIComponent(modelSlug)}`);
  return data;
}

// ── Galerie ────────────────────────────────────────────────────────
export async function fetchGalleryImages(): Promise<GalleryMedia[]> {
  const data = await fetchGalleryAll();
  return data.images;
}

export async function fetchGalleryVideos(): Promise<GalleryMedia[]> {
  const data = await fetchGalleryAll();
  return data.videos;
}

async function fetchGalleryAll(): Promise<{ images: GalleryMedia[]; videos: GalleryMedia[] }> {
  if (galleryCache) return galleryCache;
  const data = await getJson<{ images: GalleryMedia[]; videos: GalleryMedia[] }>('/api/public/gallery');
  galleryCache = data;
  return data;
}

// ── Paramètres du site (contenus éditables) ────────────────────────
export async function fetchSettings(): Promise<SiteSettings> {
  if (settingsCache) return settingsCache;
  settingsCache = await getJson<SiteSettings>('/api/public/settings');
  return settingsCache;
}

// ── URL du PDF catalogue (paramétrable dans le tableau de bord) ────
export async function fetchCatalogUrl(): Promise<string | null> {
  try {
    const settings = await fetchSettings();
    return settings.catalogPdf?.url || null;
  } catch (error) {
    console.error('Error fetching catalog url', error);
    return null;
  }
}

// ── Prospects (remplace l'envoi vers Google Apps Script) ───────────
export async function submitLead(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  serviceType?: string;
  message?: string;
  source?: string;
  website?: string; // pot de miel anti-spam (champ caché)
}) {
  const res = await fetch('/api/public/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || "Erreur d'envoi de la demande");
  }
  return res.json();
}

// ── Commande SANS acompte en ligne (produits avec paiement désactivé) ─
export async function submitNoDepositOrder(data: {
  productId: number;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  website?: string;
}): Promise<{ success: boolean; reference: string }> {
  const res = await fetch('/api/public/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({ error: 'Erreur réseau' }));
  if (!res.ok) throw new Error(body.error || "Erreur d'enregistrement de la commande");
  return body;
}

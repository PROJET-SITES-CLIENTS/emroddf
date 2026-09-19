// ══════════════════════════════════════════════════════════════════
// ROUTEUR UNIQUE — api/[[...path]].ts
//
// Le plan Hobby de Vercel limite les déploiements à 12 fonctions
// serverless : toutes les routes API vivent donc dans CETTE fonction,
// qui distribue vers les handlers de api/_routes/* (logique inchangée).
// Les URLs publiques restent exactement les mêmes (/api/...).
// ══════════════════════════════════════════════════════════════════
import type { IncomingMessage, ServerResponse } from 'http';

// Corps brut préservé pour la vérification HMAC du webhook
export const config = { api: { bodyParser: false } };

import login from './_routes/admin/login';
import logout from './_routes/admin/logout';
import session from './_routes/admin/session';
import stats from './_routes/admin/stats';
import settingsAdmin from './_routes/admin/settings';
import password from './_routes/admin/password';
import testEmail from './_routes/admin/test-email';
import categories from './_routes/admin/categories';
import categoryItem from './_routes/admin/categories/[id]';
import products from './_routes/admin/products';
import productItem from './_routes/admin/products/[id]';
import productImages from './_routes/admin/products/[id]/images';
import imageItem from './_routes/admin/images/[imageId]';
import gallery from './_routes/admin/gallery';
import galleryItem from './_routes/admin/gallery/[id]';
import galleryReorder from './_routes/admin/gallery/reorder';
import leads from './_routes/admin/leads';
import leadItem from './_routes/admin/leads/[id]';
import orders from './_routes/admin/orders';
import orderItem from './_routes/admin/orders/[id]';
import catalogue from './_routes/public/catalogue';
import productPublic from './_routes/public/product/[categorySlug]/[modelSlug]';
import galleryPublic from './_routes/public/gallery';
import settingsPublic from './_routes/public/settings';
import leadsPublic from './_routes/public/leads';
import ordersPublic from './_routes/public/orders';
import paymentCreate from './_routes/payment/create';
import paymentWebhook from './_routes/payment/webhook';
import blobUpload from './_routes/blob-upload';

type Handler = (req: any, res: any) => Promise<any> | any;
interface Route { method: string; segments: string[]; handler: Handler }

// Les routes littérales doivent précéder les routes paramétrées du
// même préfixe (ex : gallery/reorder avant gallery/:id)
const ROUTES: Route[] = [
  // ── Admin : session ──────────────────────────────────────────
  { method: 'POST', segments: ['admin', 'login'], handler: login },
  { method: 'POST', segments: ['admin', 'logout'], handler: logout },
  { method: 'GET', segments: ['admin', 'session'], handler: session },
  { method: 'GET', segments: ['admin', 'stats'], handler: stats },
  { method: 'GET', segments: ['admin', 'settings'], handler: settingsAdmin },
  { method: 'PUT', segments: ['admin', 'settings'], handler: settingsAdmin },
  { method: 'PUT', segments: ['admin', 'password'], handler: password },
  { method: 'POST', segments: ['admin', 'test-email'], handler: testEmail },
  // ── Admin : catégories ───────────────────────────────────────
  { method: 'GET', segments: ['admin', 'categories'], handler: categories },
  { method: 'POST', segments: ['admin', 'categories'], handler: categories },
  { method: 'PUT', segments: ['admin', 'categories', ':id'], handler: categoryItem },
  { method: 'DELETE', segments: ['admin', 'categories', ':id'], handler: categoryItem },
  // ── Admin : produits ─────────────────────────────────────────
  { method: 'GET', segments: ['admin', 'products'], handler: products },
  { method: 'POST', segments: ['admin', 'products'], handler: products },
  { method: 'GET', segments: ['admin', 'products', ':id'], handler: productItem },
  { method: 'PUT', segments: ['admin', 'products', ':id'], handler: productItem },
  { method: 'DELETE', segments: ['admin', 'products', ':id'], handler: productItem },
  { method: 'POST', segments: ['admin', 'products', ':id', 'images'], handler: productImages },
  { method: 'PUT', segments: ['admin', 'products', ':id', 'images'], handler: productImages },
  { method: 'DELETE', segments: ['admin', 'images', ':imageId'], handler: imageItem },
  // ── Admin : galerie ──────────────────────────────────────────
  { method: 'GET', segments: ['admin', 'gallery'], handler: gallery },
  { method: 'POST', segments: ['admin', 'gallery'], handler: gallery },
  { method: 'PUT', segments: ['admin', 'gallery', 'reorder'], handler: galleryReorder },
  { method: 'PUT', segments: ['admin', 'gallery', ':id'], handler: galleryItem },
  { method: 'DELETE', segments: ['admin', 'gallery', ':id'], handler: galleryItem },
  // ── Admin : prospects / commandes ────────────────────────────
  { method: 'GET', segments: ['admin', 'leads'], handler: leads },
  { method: 'PUT', segments: ['admin', 'leads', ':id'], handler: leadItem },
  { method: 'DELETE', segments: ['admin', 'leads', ':id'], handler: leadItem },
  { method: 'GET', segments: ['admin', 'orders'], handler: orders },
  { method: 'PUT', segments: ['admin', 'orders', ':id'], handler: orderItem },
  { method: 'DELETE', segments: ['admin', 'orders', ':id'], handler: orderItem },
  // ── Public ───────────────────────────────────────────────────
  { method: 'GET', segments: ['public', 'catalogue'], handler: catalogue },
  { method: 'GET', segments: ['public', 'gallery'], handler: galleryPublic },
  { method: 'GET', segments: ['public', 'settings'], handler: settingsPublic },
  { method: 'POST', segments: ['public', 'leads'], handler: leadsPublic },
  { method: 'POST', segments: ['public', 'orders'], handler: ordersPublic },
  { method: 'GET', segments: ['public', 'product', ':categorySlug', ':modelSlug'], handler: productPublic },
  // ── Paiement ─────────────────────────────────────────────────
  { method: 'POST', segments: ['payment', 'create'], handler: paymentCreate },
  { method: 'POST', segments: ['payment', 'webhook'], handler: paymentWebhook },
  // ── Upload Vercel Blob (client @vercel/blob) ─────────────────
  { method: 'POST', segments: ['vercel', 'blob', 'upload'], handler: blobUpload },
];

const WEBHOOK_PATH = 'payment/webhook';

/** Extrait method + segments + query de l'URL */
function parseUrl(rawUrl: string = ''): { segments: string[]; query: Record<string, string> } {
  const [pathPart, queryPart] = rawUrl.split('?');
  const segments = pathPart
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v = ''] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }
  return { segments, query };
}

/**
 * Résout la route réelle :
 *  - soit appel direct : /api/public/catalogue?x=1
 *  - soit appel réécrit par vercel.json : /api/router?__route=/public/catalogue&x=1
 * Retourne l'URL d'origine reconstruite (nécessaire aux bibliothèques qui
 * inspectent req.url, comme l'upload Vercel Blob).
 */
function resolveRequest(rawUrl: string = ''): { url: string; segments: string[]; query: Record<string, string> } {
  let [pathPart, queryPart = ''] = rawUrl.split('?');
  const query: Record<string, string> = {};
  for (const pair of queryPart.split('&')) {
    const [k, v = ''] = pair.split('=');
    if (k) query[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  if ((pathPart === '/api/router' || pathPart === '/api/router/') && query.__route) {
    const route = query.__route.startsWith('/') ? query.__route : `/${query.__route}`;
    delete query.__route;
    pathPart = `/api${decodeURIComponent(route)}`;
  }
  const segments = pathPart
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
  const qs = Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return { url: qs ? `${pathPart}?${qs}` : pathPart, segments, query };
}

/** Correspondance route ⟷ segments (avec paramètres ':name') */
function matchRoute(route: Route, segments: string[]): Record<string, string> | null {
  if (route.segments.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < route.segments.length; i++) {
    const rs = route.segments[i];
    if (rs.startsWith(':')) params[rs.slice(1)] = segments[i];
    else if (rs !== segments[i]) return null;
  }
  return params;
}

/** Lit et parse le corps JSON (bodyParser désactivé au niveau fonction) */
async function parseBody(req: IncomingMessage): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) { (req as any).body = undefined; return; }
  const raw = Buffer.concat(chunks).toString('utf8');
  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('application/json')) {
    try { (req as any).body = JSON.parse(raw); return; } catch { /* garde le brut */ }
  }
  (req as any).body = raw;
}

export default async function handler(req: IncomingMessage & { query?: any }, res: ServerResponse) {
  const { url: originalUrl, segments, query } = resolveRequest(req.url || '');
  // Les handlers et les bibliothèques (upload Blob) inspectent req.url :
  // on restaure toujours l'URL d'origine
  req.url = originalUrl;
  const method = (req.method || 'GET').toUpperCase();

  const route = ROUTES.map((r) => ({ r, params: matchRoute(r, segments) })).find((x) => x.params !== null);

  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: `Route inconnue : ${method} /api/${segments.join('/')}` }));
    return;
  }

  try {
    // Le webhook exige le corps BRUT (signature HMAC) : pas de parsing
    if (method !== 'GET' && method !== 'HEAD' && segments.join('/') !== WEBHOOK_PATH) {
      await parseBody(req);
    }

    // Les handlers lisent req.query (params de route + query string)
    (req as any).query = { ...query, ...route.params };

    await route.r.handler(req, res);
  } catch (err: any) {
    console.error('Router error:', method, req.url, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Erreur interne' }));
    }
  }
}

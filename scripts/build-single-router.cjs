// ══════════════════════════════════════════════════════════════════
// GÉNÉRATEUR — fusionne api/lib + api/routes dans api/router.ts
// (une seule fonction serverless : contrainte plan Hobby Vercel)
// Usage : node scripts/build-single-router.cjs
// ══════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const HANDLERS = [
  ['routes/admin/login.ts', 'login'],
  ['routes/admin/logout.ts', 'logout'],
  ['routes/admin/session.ts', 'session'],
  ['routes/admin/stats.ts', 'stats'],
  ['routes/admin/settings.ts', 'settingsAdmin'],
  ['routes/admin/password.ts', 'password'],
  ['routes/admin/test-email.ts', 'testEmail'],
  ['routes/admin/categories.ts', 'categories'],
  ['routes/admin/categories/[id].ts', 'categoryItem'],
  ['routes/admin/products.ts', 'products'],
  ['routes/admin/products/[id].ts', 'productItem'],
  ['routes/admin/products/[id]/images.ts', 'productImages'],
  ['routes/admin/images/[imageId].ts', 'imageItem'],
  ['routes/admin/gallery.ts', 'gallery'],
  ['routes/admin/gallery/[id].ts', 'galleryItem'],
  ['routes/admin/gallery/reorder.ts', 'galleryReorder'],
  ['routes/admin/leads.ts', 'leads'],
  ['routes/admin/leads/[id].ts', 'leadItem'],
  ['routes/admin/orders.ts', 'orders'],
  ['routes/admin/orders/[id].ts', 'orderItem'],
  ['routes/public/catalogue.ts', 'catalogue'],
  ['routes/public/product/[categorySlug]/[modelSlug].ts', 'productPublic'],
  ['routes/public/gallery.ts', 'galleryPublic'],
  ['routes/public/settings.ts', 'settingsPublic'],
  ['routes/public/leads.ts', 'leadsPublic'],
  ['routes/public/orders.ts', 'ordersPublic'],
  ['routes/payment/create.ts', 'paymentCreate'],
  ['routes/payment/webhook.ts', 'paymentWebhook'],
  ['routes/blob-upload.ts', 'blobUpload'],
];

const LIBS = ['lib/db.ts', 'lib/auth.ts', 'lib/deposit.ts', 'lib/mailer.ts'];

/** Nettoie un fichier source : retire imports, exports par défaut, config legacy */
function cleanSource(src, { wrap = true, keepExports = false } = {}) {
  let s = src;
  // Retire les imports (externes et relatifs) — hoistés manuellement en tête
  s = s.replace(/^import[^\n]*\n/gm, '');
  if (!keepExports) {
    // export default async function handler → async function handler
    s = s.replace(/export default async function handler/g, 'async function handler');
    s = s.replace(/export default function handler/g, 'function handler');
    // Autres exports nommés → locaux
    s = s.replace(/^export (async )?function /gm, '$1function ');
    s = s.replace(/^export const /gm, 'const ');
    s = s.replace(/^export type /gm, 'type ');
    s = s.replace(/^export interface /gm, 'interface ');
  }
  // Directive legacy
  s = s.replace(/^export const config = \{[^}]*\};?\n/gm, '');
  // Le JSON des paramètres par défaut → constante embarquée
  s = s.replace(/\bdefaults\b/g, 'DEFAULT_SETTINGS');
  return s;
}

function build() {
  const defaults = fs.readFileSync('db/default-settings.json', 'utf8');
  const parts = [];

  parts.push(`// ══════════════════════════════════════════════════════════════
// ROUTEUR UNIQUE EMROD — FICHIER GÉNÉRÉ, NE PAS ÉDITER À LA MAIN
// Source de vérité : api/lib/*, api/routes/* + scripts/build-single-router.cjs
// Régénérer : node scripts/build-single-router.cjs
//
// Contrainte : le plan Vercel Hobby limite à 12 fonctions et le builder
// n'incline pas les imports relatifs → tout le serveur vit dans CE fichier
// (une seule fonction, aucune dépendance locale).
// ══════════════════════════════════════════════════════════════
import crypto from 'crypto';
import postgres from 'postgres';
import nodemailer from 'nodemailer';
import { del } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import type { HandleUploadBody } from '@vercel/blob/client';
import type { IncomingMessage, ServerResponse } from 'http';

// Paramètres par défaut du site (miroir de db/default-settings.json)
const DEFAULT_SETTINGS = ${defaults.trim()};
`);

  // Bibliothèques partagées (db, auth, deposit, mailer) — portée module,
  // exports conservés (utilisés par les tests)
  for (const lib of LIBS) {
    const body = cleanSource(fs.readFileSync(path.join('server', lib), 'utf8'), { wrap: false, keepExports: true });
    parts.push(`\n// ───────────────────────── ${lib} ─────────────────────────\n${body}`);
  }

  // Chaque handler dans sa propre usine → aucune collision de noms
  for (const [file, name] of HANDLERS) {
    const body = cleanSource(fs.readFileSync(path.join('server', file), 'utf8'));
    parts.push(`\n// ───────────────────────── ${file} ─────────────────────────\nexport const ${name} = (() => {\n${body}\nreturn handler;\n})();`);
  }

  // Table de routage + distribution (depuis le routeur actuel)
  const routerSrc = fs.readFileSync('api/router.ts', 'utf8');
  const dispatchPart = routerSrc.slice(routerSrc.indexOf('type Handler'));
  parts.push(`\n// ───────────────────────── distribution ─────────────────────────\n${dispatchPart}`);

  fs.writeFileSync('api/router.ts', parts.join('\n'));
  console.log('✅ api/router.ts généré :', HANDLERS.length, 'handlers +', LIBS.length, 'libs');
}

build();

// ══════════════════════════════════════════════════════════════
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
const DEFAULT_SETTINGS = {
  "contact": {
    "address": "T7, Corniche Nord\nVirage du lac Sonfonia Centre\n(Carrefour Canal Plus)\nConakry, Guinée",
    "phones": ["+224 623 88 59 59", "+224 621 08 41 46"],
    "whatsapp": "224623885959",
    "emails": ["contact@emroddf.com", "direction@emroddf.com"],
    "hours": "Lundi - Samedi: 8h - 18h",
    "hoursShort": "Lun–Sam · 8h–18h"
  },
  "home": {
    "badge": "Sur mesure / Fait par des femmes",
    "title1": "Des meubles uniques,",
    "title2": "sur mesure.",
    "subtitle": "Créés par des femmes pour votre intérieur. Nous créons des meubles solides et beaux, en mélangeant le travail à la main et des idées modernes.",
    "cta1Label": "Découvrir le catalogue",
    "cta2Label": "Création Sur-Mesure",
    "heroImages": [
      "/hero-new.jpg",
      "/gallery/IMG-20260531-WA0038.jpg",
      "/gallery/IMG-20260531-WA0040.jpg",
      "/gallery/IMG-20260531-WA0062.jpg"
    ],
    "marquee": [
      "Bois Nobles de Guinée",
      "Savoir-Faire",
      "Haute Couture",
      "Finition Main",
      "Éthique & Durabilité",
      "Sur-Mesure",
      "Excellence"
    ],
    "stats": [
      { "value": 5, "suffix": "+", "label": "Ans d'Expertise" },
      { "value": 200, "suffix": "+", "label": "Projets Livrés" },
      { "value": 100, "suffix": "%", "label": "Sur-Mesure" },
      { "value": 48, "suffix": "h", "label": "Délai de réponse" }
    ],
    "values": [
      {
        "title": "Matériaux Nobles",
        "text": "Nous sélectionnons scrupuleusement nos chênes, noyers, cuirs pleine fleur, et métaux texturés auprès de fournisseurs éthiques, pour un rendu incomparable."
      },
      {
        "title": "Finition Haute Couture",
        "text": "L'ajustement au millimètre. Nos vernis et huiles naturelles sont appliqués à la main pour révéler la beauté singulière de chaque veinure."
      },
      {
        "title": "Durabilité Absolue",
        "text": "Nous ne créons pas de meubles jetables. Nos créations sont des héritages conçus pour traverser les décennies et résister aux aléas du temps."
      }
    ],
    "signatureParagraphs": [
      "Vous êtes au centre de chaque création. Nous sélectionnons soigneusement chaque pièce de bois pour concevoir avec vous des meubles robustes, esthétiques et parfaitement adaptés à votre style de vie.",
      "Chaque pièce est le fruit d'un travail manuel minutieux, pensée pour dépasser vos attentes et magnifier votre intérieur."
    ],
    "realisations": [
      "/gallery/IMG-20260531-WA0035.jpg",
      "/gallery/IMG-20260531-WA0079.jpg",
      "/gallery/IMG-20260531-WA0040.jpg",
      "/gallery/IMG-20260531-WA0051.jpg",
      "/gallery/IMG-20260531-WA0042.jpg",
      "/gallery/IMG-20260531-WA0088.jpg",
      "/gallery/IMG-20260531-WA0038.jpg",
      "/gallery/IMG-20260524-WA0011.jpg",
      "/gallery/IMG-20260531-WA0062.jpg"
    ]
  },
  "testimonials": [
    {
      "text": "Une qualité exceptionnelle. La table à manger dessinée pour notre loft est devenue la pièce maîtresse absolue. Un travail remarquable sur les joints et le vernis.",
      "author": "Sophie L.",
      "role": "Architecte d'intérieur"
    },
    {
      "text": "L'écoute, la patience, et le niveau de détail de la créatrice sont inégalables. Le meuble TV sur-mesure s'intègre parfaitement et cache intelligemment toute la technique.",
      "author": "Marc & Valérie",
      "role": "Clients particuliers"
    },
    {
      "text": "EMROD a su transformer ma vision en réalité. La bibliothèque sur-mesure occupe toute la hauteur sous plafond avec une précision au millimètre. Impressionnant.",
      "author": "Jean-Paul M.",
      "role": "Entrepreneur"
    }
  ],
  "partners": ["PARTENAIRE 1", "PARTENAIRE 2", "PARTENAIRE 3", "PARTENAIRE 4"],
  "faq": [
    {
      "q": "Quels sont vos délais de fabrication ?",
      "a": "Nos délais varient généralement entre **4 et 8 semaines** selon la complexité de la pièce. Nous vous communiquons un délai précis lors de l'établissement du devis."
    },
    {
      "q": "Où êtes-vous situés ?",
      "a": "Notre atelier se trouve à **Conakry** : T7, Corniche Nord, virage du lac Sonfonia Centre (Carrefour Canal Plus)."
    },
    {
      "q": "Comment passer une commande sur mesure ?",
      "a": "Tout commence par un échange — en ligne ou à l'atelier. Nous écoutons vos besoins, réalisons des croquis, puis établissons un devis. Un **acompte de 60%** est demandé à la commande pour lancer la fabrication."
    },
    {
      "q": "Faites-vous la livraison ?",
      "a": "Oui ! Nous livrons sur **tout Conakry**. Pour l'intérieur du pays, nous étudions des solutions logistiques sécurisées selon votre localisation."
    },
    {
      "q": "Quels matériaux utilisez-vous ?",
      "a": "Nous travaillons avec des **bois locaux et nobles de Guinée**, du métal, du cuir, et des finitions haut de gamme (vernis, huiles naturelles) pour garantir durabilité et élégance."
    },
    {
      "q": "Puis-je personnaliser un modèle existant ?",
      "a": "Absolument ! Tous nos modèles peuvent être **adaptés à vos dimensions**, dans l'essence de bois et la finition de votre choix. Votre vision, notre expertise."
    },
    {
      "q": "Quels sont vos moyens de paiement ?",
      "a": "Nous acceptons le **paiement en ligne (Mobile Money via Djomy)**, les **virements bancaires**, les **chèques**, ainsi que **Orange Money** et **Mobile Money**."
    },
    {
      "q": "Est-il possible de visiter votre atelier ?",
      "a": "Avec grand plaisir ! Nous vous recevons **sur rendez-vous** à notre atelier de Sonfonia pour discuter de votre projet et vous montrer notre savoir-faire en direct."
    },
    {
      "q": "Faites-vous des aménagements pour professionnels ?",
      "a": "Tout à fait. Nous réalisons des aménagements sur mesure pour les professionnels : **bureaux de direction**, comptoirs d'accueil, présentoirs pour boutiques, et bien plus."
    }
  ],
  "faqContact": [
    {
      "q": "Quels sont vos délais de fabrication ?",
      "a": "Les délais varient entre 4 et 8 semaines selon la complexité de la pièce et le carnet de commandes actuel de l'atelier EMROD. Nous vous communiquons un délai précis lors du devis."
    },
    {
      "q": "Proposez-vous des facilités de paiement ?",
      "a": "Un acompte de 60% est demandé à la commande (payable en ligne via Mobile Money), et le solde restant est à régler lors de la livraison. Des modalités particulières peuvent être étudiées selon le projet."
    },
    {
      "q": "Livrez-vous à Conakry et à l'intérieur du pays ?",
      "a": "Oui, nous organisons la livraison sur tout Conakry et pouvons étudier des solutions logistiques sécurisées vers les autres préfectures de la Guinée."
    },
    {
      "q": "Peut-on visiter l'atelier avant de commander ?",
      "a": "Absolument ! Nous encourageons même les visites. Prendre rendez-vous vous permettra de voir nos matériaux, nos finitions en cours et de discuter directement avec la créatrice."
    }
  ],
  "about": {
    "paragraphs": [
      "L'aventure EMROD a commencé par une véritable passion pour le travail du bois et l'aménagement d'intérieur. Portée par une équipe de femmes talentueuses et déterminées, l'entreprise s'est donnée pour mission de transformer des matériaux nobles en créations uniques et sur mesure.",
      "Aujourd'hui, notre atelier incarne l'alliance parfaite entre artisanat minutieux et design contemporain. Nous croyons qu'un meuble n'est pas seulement fonctionnel : il reflète votre personnalité, raconte une histoire et donne vie à votre intérieur."
    ],
    "quote": "Le client est au cœur de tout le projet. Chaque réalisation est pensée et conçue en totale synergie avec vos envies.",
    "steps": [
      {
        "title": "Choix du matériel",
        "desc": "Le choix du matériel se fait en commun accord avec le client (notamment sur la partie matériaux nobles)."
      },
      {
        "title": "Validation du design",
        "desc": "Nous réalisons des croquis et des plans détaillés. La validation du design se fait en accord avec le client avant de lancer la production."
      },
      {
        "title": "Façonnage, Finitions et Durabilité",
        "desc": "Nous fabriquons votre meuble avec des techniques modernes (découpe de précision, assemblage optimisé). Nous appliquons ensuite les vernis et huiles de finition à la main pour garantir une grande durabilité."
      },
      {
        "title": "Livraison et Montage",
        "desc": "L'installation se fait directement chez vous par notre équipe, garantissant un ajustement parfait et une durabilité maximale du meuble."
      }
    ]
  },
  "catalogPdf": { "url": "/catalogue_emrod.pdf" },
  "seo": {
    "title": "EMROD SARL | Artisanat d'Exception",
    "description": "EMROD SARL - Création artisanale de mobilier d'exception sur-mesure à Conakry. Menuiserie haut de gamme et aménagement intérieur en Guinée."
  },
  "payment": { "depositRate": 0.6 }
};


// ───────────────────────── lib/db.ts ─────────────────────────
// ══════════════════════════════════════════════════════════════════
// Accès base de données Neon PostgreSQL — pilote postgres.js (TCP)
//
// NB : le pilote @neondatabase/serverless crashait dans le runtime
// de production Vercel (résolution "navigateur" du paquet par leur
// bundler). postgres.js est un pilote Node pur, compatible Vercel
// Functions, avec la même API de templates tagués.
// ══════════════════════════════════════════════════════════════════

export type SqlClient = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;

let cachedClient: SqlClient | null = null;

export function db(): SqlClient {
  if (!cachedClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL non configurée');
    const client = postgres(url, {
      ssl: 'require',
      max: 1,                // une connexion par instance serverless
      idle_timeout: 20,
      connect_timeout: 10,
    });
    // Parsing explicite JSON (114) et JSONB (3802) — sinon chaînes brutes
    const parseJson = (v: string) => { try { return JSON.parse(v); } catch { return v; } };
    client.options.parsers[114] = parseJson as any;
    client.options.parsers[3802] = parseJson as any;
    // Sérialisation idempotente : une chaîne déjà encodée passe telle
    // quelle (évite le double encodage jsonb à l'écriture)
    const toJson = (v: any) => (typeof v === 'string' ? v : JSON.stringify(v));
    client.options.serializers[114] = toJson as any;
    client.options.serializers[3802] = toJson as any;
    cachedClient = client as unknown as SqlClient;
  }
  return cachedClient;
}

// ── Slugification (identique au front) ─────────────────────────────
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-');
}

// ── Génère un slug unique en base (suffixe -2, -3... si pris) ─────
export async function uniqueSlug(
  table: 'categories' | 'products',
  base: string,
  excludeId?: number
): Promise<string> {
  const sql = db();
  const baseSlug = slugify(base) || 'sans-nom';
  let candidate = baseSlug;
  let suffix = 2;
  for (;;) {
    const rows =
      table === 'categories'
        ? excludeId !== undefined
          ? await sql`SELECT id FROM categories WHERE slug = ${candidate} AND id != ${excludeId} LIMIT 1`
          : await sql`SELECT id FROM categories WHERE slug = ${candidate} LIMIT 1`
        : excludeId !== undefined
          ? await sql`SELECT id FROM products WHERE slug = ${candidate} AND id != ${excludeId} LIMIT 1`
          : await sql`SELECT id FROM products WHERE slug = ${candidate} LIMIT 1`;
    if (rows.length === 0) return candidate;
    candidate = `${baseSlug}-${suffix++}`;
  }
}

// ── Lecture/écriture d'un paramètre site (JSONB) ───────────────────
export async function getSetting(key: string): Promise<any> {
  const sql = db();
  const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: any): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key)
    DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_at = now()
  `;
}

export async function getAllSettings(): Promise<Record<string, any>> {
  const sql = db();
  const rows = await sql`SELECT key, value FROM settings`;
  const out: Record<string, any> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}


// ───────────────────────── lib/auth.ts ─────────────────────────
// ══════════════════════════════════════════════════════════════════
// Authentification administrateur — compte unique + cookie signé HMAC
//
// Mot de passe (priorité décroissante) :
//   1. Mot de passe défini depuis le tableau de bord (Mon compte) —
//      stocké haché (scrypt + sel) dans settings.key = 'adminPassword'
//   2. Variable d'environnement ADMIN_PASSWORD (mot de passe initial)
// ══════════════════════════════════════════════════════════════════

const COOKIE_NAME = 'emrod_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 heures
const PASSWORD_SETTINGS_KEY = 'adminPassword';

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET non configurée');
  return secret;
}

// Comparaison à temps constant pour éviter les attaques temporelles
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Jeton de session : payload.base64 HMAC-SHA256 ──────────────────
export function createSessionToken(): string {
  const payload = base64url(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  const sig = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  if (!safeEqual(sig, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

// ── Mots de passe hachés (scrypt) ──────────────────────────────────
function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyHashedPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
}

/** Lit le mot de passe haché défini via le tableau de bord (s'il existe) */
async function getStoredPassword(): Promise<{ salt: string; hash: string } | null> {
  try {
    const sql = db();
    const rows = await sql`SELECT value FROM settings WHERE key = ${PASSWORD_SETTINGS_KEY}`;
    const v = rows[0]?.value;
    if (v && typeof v === 'object' && v.salt && v.hash) return v as { salt: string; hash: string };
  } catch { /* base indisponible → repli env */ }
  return null;
}

/**
 * Définit un nouveau mot de passe administrateur (haché en base).
 * Le mot de passe d'environnement devient inactif dès qu'un mot de
 * passe est défini ici.
 */
export async function setPassword(newPassword: string): Promise<void> {
  const { salt, hash } = hashPassword(newPassword);
  await setSetting(PASSWORD_SETTINGS_KEY, { salt, hash, updatedAt: new Date().toISOString() });
}

/** Supprime le mot de passe en base (retour au mot de passe env) */
export async function clearStoredPassword(): Promise<void> {
  const sql = db();
  await sql`DELETE FROM settings WHERE key = ${PASSWORD_SETTINGS_KEY}`;
}

/** Un mot de passe a-t-il été défini depuis le tableau de bord ? */
export async function hasStoredPassword(): Promise<boolean> {
  return (await getStoredPassword()) !== null;
}

// ── Vérification des identifiants admin ────────────────────────────
export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!envEmail) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), envEmail);

  // 1. Mot de passe défini via le tableau de bord : il fait foi
  const stored = await getStoredPassword();
  if (stored) {
    return emailOk && verifyHashedPassword(password, stored.salt, stored.hash);
  }

  // 2. Repli : mot de passe d'environnement
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!envPassword) return false;
  return emailOk && safeEqual(password, envPassword);
}

// ── Gestion du cookie (httpOnly, Secure en prod, SameSite=Lax) ─────
export function setSessionCookie(res: any, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`
  );
}

export function clearSessionCookie(res: any): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// ── Garde d'authentification pour les routes admin ─────────────────
// Retourne true si autorisé, sinon répond 401 et retourne false.
export function requireAdmin(req: any, res: any): boolean {
  const cookies = req.headers?.cookie || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  const token = match?.[1];
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: 'Non autorisé' });
    return false;
  }
  return true;
}


// ───────────────────────── lib/deposit.ts ─────────────────────────
// ══════════════════════════════════════════════════════════════════
// Calcul de l'acompte — logique unique partagée (API serveur).
// Le front duplique cette logique pour l'affichage (src/lib/api.ts).
// ══════════════════════════════════════════════════════════════════

export type DepositMode = 'percent' | 'fixed' | 'none';

/**
 * Calcule le montant d'acompte (GNF) pour un produit.
 *
 * @returns le montant en GNF, ou `null` si le paiement en ligne est
 *          désactivé (mode 'none') ou si la configuration est invalide.
 */
export function computeDeposit(
  priceTotal: number,
  mode: string | null | undefined,
  value: number | null | undefined
): number | null {
  if (mode === 'none') return null;

  if (mode === 'fixed') {
    const amount = Math.round(Number(value) || 0);
    return amount > 0 ? amount : null;
  }

  // Mode par défaut : pourcentage du prix total
  const percent = Math.min(Math.max(Number(value) || 0, 0), 100);
  if (percent <= 0) return null;
  const price = Number(priceTotal) || 0;
  if (price <= 0) return null;
  return Math.round((price * percent) / 100);
}

/** Libellé lisible du mode d'acompte (utilisé dans les réponses API). */
export function depositLabel(mode: string, value: number): string {
  if (mode === 'none') return 'Paiement en ligne désactivé';
  if (mode === 'fixed') return `Acompte fixe : ${new Intl.NumberFormat('fr-FR').format(value)} GNF`;
  return `Acompte : ${value}% du prix`;
}


// ───────────────────────── lib/mailer.ts ─────────────────────────
// ══════════════════════════════════════════════════════════════════
// Envoi d'emails de notification via SMTP (Nodemailer).
//
// Configuration (priorité décroissante) :
//   1. Section « smtp » des paramètres (éditable dans le tableau de
//      bord → Paramètres → Notifications) — stockée en base
//   2. Variables d'environnement SMTP_HOST / SMTP_PORT / SMTP_SECURE /
//      SMTP_USER / SMTP_PASS / NOTIFY_EMAIL
//
// Si aucune configuration n'existe, les notifications sont ignorées
// silencieusement (journalisées) — le site fonctionne normalement.
// ══════════════════════════════════════════════════════════════════

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from?: string; // adresse expéditeur (défaut : user)
  to?: string;   // destinataire (défaut : user)
}

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;
let cachedKey = '';

async function resolveConfig(): Promise<SmtpConfig | null> {
  // 1. Configuration en base (tableau de bord)
  let stored: any = null;
  try {
    stored = await getSetting('smtp');
  } catch { /* base indisponible → repli env */ }

  if (stored && stored.host && stored.user && stored.pass) {
    return {
      host: String(stored.host),
      port: Number(stored.port) || 587,
      secure: Boolean(stored.secure ?? Number(stored.port) === 465),
      user: String(stored.user),
      pass: String(stored.pass),
      from: stored.from || undefined,
      to: stored.to || undefined,
    };
  }

  // 2. Variables d'environnement
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      to: process.env.NOTIFY_EMAIL || undefined,
    };
  }

  return null;
}

async function getTransport(): Promise<{ transport: any; from: string; to: string } | null> {
  const cfg = await resolveConfig();
  if (!cfg) return null;

  // Le cache inclut le mot de passe : un changement de config en base
  // reconstruit automatiquement le transport
  const key = JSON.stringify([cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass, cfg.from, cfg.to]);
  if (!cachedTransport || cachedKey !== key) {
    cachedTransport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    cachedKey = key;
  }
  return { transport: cachedTransport, from: cfg.from || cfg.user, to: cfg.to || cfg.user };
}

// ── Gabarit email EMROD ────────────────────────────────────────────
export function emailShell(title: string, rows: [string, string][], cta?: { label: string; url: string }): string {
  const cells = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 16px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:8px 16px;color:#111827;font-size:13px;font-weight:600;">${v}</td>
      </tr>`
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0d3320,#11522f);padding:20px 24px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px;">EMROD SARL</span>
      <span style="color:#e85d04;font-size:11px;margin-left:10px;letter-spacing:2px;">ADMINISTRATION</span>
    </div>
    <div style="padding:8px 0 16px;">
      <h2 style="margin:16px 24px 4px;color:#0d3320;font-size:18px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">${cells}</table>
      ${
        cta
          ? `<div style="padding:16px 24px 0;">
               <a href="${cta.url}" style="display:inline-block;background:#e85d04;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:bold;">${cta.label}</a>
             </div>`
          : ''
      }
      <p style="margin:20px 24px 0;color:#9ca3af;font-size:11px;">Message automatique envoyé par le site EMROD — aucune réponse n'est nécessaire.</p>
    </div>
  </div>
</body></html>`;
}

function textVersion(rows: [string, string][]): string {
  return rows.map(([k, v]) => `${k} : ${v}`).join('\n');
}

/**
 * Envoie une notification email. Ne lève JAMAIS d'exception :
 * une défaillance SMTP ne doit pas interrompre le flux principal.
 * @returns true si envoyé, false sinon.
 */
export async function sendNotification(subject: string, rows: [string, string][], cta?: { label: string; url: string }): Promise<boolean> {
  const t = await getTransport();
  if (!t) {
    console.log(`📧 SMTP non configuré — notification ignorée : ${subject}`);
    return false;
  }
  try {
    await t.transport.sendMail({
      from: `"Site EMROD" <${t.from}>`,
      to: t.to,
      subject,
      text: `${subject}\n\n${textVersion(rows)}`,
      html: emailShell(subject, rows, cta),
    });
    return true;
  } catch (e: any) {
    console.error(`Erreur envoi email "${subject}" :`, e.message);
    return false;
  }
}

/** Indique si un SMTP est configuré (base ou env) — utilisé par l'UI */
export async function isSmtpConfigured(): Promise<boolean> {
  return (await resolveConfig()) !== null;
}


// ───────────────────────── routes/admin/login.ts ─────────────────────────
export const login = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/admin/login — { email, password } → cookie de session
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { email, password } = body;

    if (!email || !password || !(await checkCredentials(email, password))) {
      // Petit délai pour ralentir le brute-force
      await new Promise((r) => setTimeout(r, 600));
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    setSessionCookie(res, createSessionToken());
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erreur de connexion' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/logout.ts ─────────────────────────
export const logout = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/admin/logout — supprime le cookie de session
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  clearSessionCookie(res);
  return res.status(200).json({ success: true });
}

return handler;
})();

// ───────────────────────── routes/admin/session.ts ─────────────────────────
export const session = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/admin/session — vérifie la validité de la session
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  return res.status(200).json({ authenticated: true });
}

return handler;
})();

// ───────────────────────── routes/admin/stats.ts ─────────────────────────
export const stats = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/admin/stats — compteurs de la page d'accueil du dashboard
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM leads)                                          AS leads_total,
        (SELECT COUNT(*)::int FROM leads WHERE status = 'new')                     AS leads_new,
        (SELECT COUNT(*)::int FROM leads WHERE created_at >= now() - interval '1 day') AS leads_today,
        (SELECT COUNT(*)::int FROM orders)                                         AS orders_total,
        (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'paid')           AS orders_paid,
        (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'pending')        AS orders_pending,
        (SELECT COALESCE(SUM(paid_amount), 0)::bigint FROM orders WHERE payment_status = 'paid') AS revenue,
        (SELECT COUNT(*)::int FROM products)                                       AS products_total,
        (SELECT COUNT(*)::int FROM products WHERE is_published)                    AS products_published,
        (SELECT COUNT(*)::int FROM gallery_items WHERE is_published)               AS gallery_published
    `;

    const recentLeads = await sql`
      SELECT id, first_name, last_name, phone, service_type, status, created_at
      FROM leads ORDER BY created_at DESC LIMIT 6
    `;
    const recentOrders = await sql`
      SELECT id, reference, product_name, customer_name, payment_status, deposit_amount, created_at
      FROM orders ORDER BY created_at DESC LIMIT 6
    `;

    return res.status(200).json({
      ...counts,
      revenue: Number(counts.revenue),
      recentLeads,
      recentOrders,
    });
  } catch (err: any) {
    console.error('stats error:', err);
    return res.status(500).json({ error: 'Erreur de chargement des statistiques' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/settings.ts ─────────────────────────
export const settingsAdmin = (() => {
// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/settings — toutes les sections (base + défauts)
//        ⚠️ 'adminPassword' n'est jamais renvoyé ; 'smtp' est renvoyé
//        sans son mot de passe (+ indicateur hasPass)
// PUT  /api/admin/settings — { key, value } : enregistre une section
//        Pour 'smtp' : un mot de passe vide conserve l'existant
// ══════════════════════════════════════════════════════════════════

const INTERNAL_KEYS = ['adminPassword']; // jamais exposés, même à l'admin

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      const stored = await getAllSettings();
      // Fusion base > défauts pour l'affichage complet dans l'éditeur
      const merged: Record<string, any> = { ...(DEFAULT_SETTINGS as Record<string, any>), ...stored };
      for (const k of INTERNAL_KEYS) delete merged[k];
      // Masquage du mot de passe SMTP (jamais renvoyé au navigateur)
      if (merged.smtp) {
        merged.smtp = { ...merged.smtp, pass: '', hasPass: Boolean(stored.smtp?.pass) };
      }
      return res.status(200).json(merged);
    } catch (err: any) {
      console.error('settings GET error:', err);
      return res.status(500).json({ error: 'Erreur de lecture des paramètres' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { key, value } = body;
      if (!key || typeof key !== 'string' || key.length > 100 || INTERNAL_KEYS.includes(key)) {
        return res.status(400).json({ error: 'Clé invalide' });
      }
      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Valeur manquante' });
      }

      // SMTP : un mot de passe vide → conserver l'existant
      if (key === 'smtp' && value && typeof value === 'object' && !value.pass) {
        const existing = await getSetting('smtp');
        if (existing?.pass) value.pass = existing.pass;
      }

      await setSetting(key, value);

      // Réponse sans secrets
      const saved = await getSetting(key);
      if (key === 'smtp' && saved) {
        return res.status(200).json({ success: true, value: { ...saved, pass: '', hasPass: Boolean(saved.pass) } });
      }
      return res.status(200).json({ success: true, value: saved });
    } catch (err: any) {
      console.error('settings PUT error:', err);
      return res.status(500).json({ error: "Erreur d'enregistrement des paramètres" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

return handler;
})();

// ───────────────────────── routes/admin/password.ts ─────────────────────────
export const password = (() => {
// ══════════════════════════════════════════════════════════════════
// PUT /api/admin/password — { currentPassword, newPassword }
// Change le mot de passe administrateur (stocké haché en base).
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel.' });
    }

    // Vérification du mot de passe actuel
    const email = (process.env.ADMIN_EMAIL || '').trim();
    const ok = await checkCredentials(email, currentPassword);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 600)); // ralentir le brute-force
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    await setPassword(newPassword);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('password change error:', err);
    return res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/test-email.ts ─────────────────────────
export const testEmail = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/admin/test-email — envoie un email de test avec la
// configuration SMTP actuelle (Paramètres → Notifications).
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sent = await sendNotification(
      '✅ Test de configuration SMTP — Site EMROD',
      [
        ['Test', 'Si vous lisez cet email, la configuration SMTP fonctionne.'],
        ['Date', new Date().toLocaleString('fr-FR')],
      ],
      { label: 'Ouvrir le tableau de bord', url: `${process.env.VITE_PUBLIC_URL || 'https://emrod.vercel.app'}/admin` }
    );

    if (!sent) {
      return res.status(400).json({
        sent: false,
        error: "Aucun SMTP configuré — renseignez la section Notifications (Paramètres) ou les variables SMTP_*.",
      });
    }
    return res.status(200).json({ sent: true });
  } catch (err: any) {
    console.error('test-email error:', err);
    return res.status(500).json({ sent: false, error: err.message });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/categories.ts ─────────────────────────
export const categories = (() => {
// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/categories — liste complète (sections + sous-sections)
// POST /api/admin/categories — { name, parentId?, position? } : création
//   parentId NULL = section principale ; sinon sous-section (le parent
//   doit être une section de premier niveau — 2 niveaux maximum).
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT c.id, c.name, c.slug, c.parent_id, c.position, c.created_at,
               p.name AS parent_name,
               (SELECT COUNT(*)::int FROM products pr WHERE pr.category_id = c.id) AS product_count
        FROM categories c
        LEFT JOIN categories p ON p.id = c.parent_id
        ORDER BY (COALESCE(p.position, c.position)), c.position, c.name
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || '').trim().slice(0, 120);
      if (!name) return res.status(400).json({ error: 'Nom de catégorie requis' });

      // Validation du parent : section de premier niveau uniquement
      let parentId: number | null = null;
      if (body.parentId !== undefined && body.parentId !== null && body.parentId !== '') {
        parentId = Number(body.parentId);
        const [parent] = await sql`
          SELECT id FROM categories WHERE id = ${parentId} AND parent_id IS NULL LIMIT 1
        `;
        if (!parent) {
          return res.status(400).json({ error: 'Le parent doit être une section principale (2 niveaux maximum).' });
        }
      }

      const slug = await uniqueSlug('categories', name);
      const [row] = await sql`
        INSERT INTO categories (name, slug, parent_id, position)
        VALUES (${name}, ${slug}, ${parentId}, ${Number(body.position) || 0})
        RETURNING id, name, slug, parent_id, position, created_at
      `;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('categories error:', err);
    return res.status(500).json({ error: 'Erreur catégories' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/categories/[id].ts ─────────────────────────
export const categoryItem = (() => {
// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/categories/[id] — { name?, position?, parentId? }
// DELETE /api/admin/categories/[id] — supprime (les sous-sections et
//         produits deviennent rattachés au niveau supérieur)
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      let name: string | undefined;
      let position: number | undefined;
      let parentId: number | null | undefined;
      if (body.name !== undefined) {
        name = String(body.name).trim().slice(0, 120);
        if (!name) return res.status(400).json({ error: 'Nom invalide' });
      }
      if (body.position !== undefined) position = Number(body.position) || 0;

      if (body.parentId !== undefined) {
        if (body.parentId === null || body.parentId === '' ) {
          parentId = null; // promouvoir en section principale
        } else {
          parentId = Number(body.parentId);
          if (parentId === id) {
            return res.status(400).json({ error: 'Une catégorie ne peut pas être sa propre sous-section.' });
          }
          const [parent] = await sql`
            SELECT id FROM categories WHERE id = ${parentId} AND parent_id IS NULL LIMIT 1
          `;
          if (!parent) {
            return res.status(400).json({ error: 'Le parent doit être une section principale (2 niveaux maximum).' });
          }
          // Interdire de transformer en sous-section une catégorie qui
          // contient déjà des sous-sections (évite un 3e niveau)
          const [{ count }] = await sql`
            SELECT COUNT(*)::int AS count FROM categories WHERE parent_id = ${id}
          `;
          if (count > 0) {
            return res.status(400).json({ error: "Cette section contient des sous-sections : elle ne peut pas devenir une sous-section." });
          }
        }
      }

      const updatesCount = [name, position, parentId].filter((v) => v !== undefined).length;
      if (updatesCount === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

      const slug = name !== undefined ? await uniqueSlug('categories', name, id) : undefined;

      const [row] = await sql`
        UPDATE categories SET
          name = COALESCE(${name ?? null}, name),
          position = COALESCE(${position ?? null}, position),
          parent_id = COALESCE(${parentId ?? null}, parent_id),
          slug = COALESCE(${slug ?? null}, slug)
        WHERE id = ${id}
        RETURNING id, name, slug, parent_id, position
      `;
      if (!row) return res.status(404).json({ error: 'Catégorie introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      // Les sous-sections sont promues au niveau supérieur (parent_id → NULL)
      await sql`UPDATE categories SET parent_id = NULL WHERE parent_id = ${id}`;
      const [row] = await sql`DELETE FROM categories WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Catégorie introuvable' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('category [id] error:', err);
    return res.status(500).json({ error: 'Erreur catégorie' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/products.ts ─────────────────────────
export const products = (() => {
// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/products — liste admin (incl. non publiés)
// POST /api/admin/products — création produit
//   { name, categoryId?, description?, price?, dimensions?, finition?,
//     essence?, isPublished?, position?,
//     depositMode? ('percent'|'fixed'|'none'), depositValue? }
// ══════════════════════════════════════════════════════════════════

const DEPOSIT_MODES = ['percent', 'fixed', 'none'];

function parseDeposit(body: any): { mode: string; value: number } {
  const mode = DEPOSIT_MODES.includes(body.depositMode) ? body.depositMode : 'percent';
  const value = Math.max(0, Math.round(Number(body.depositValue) || 0));
  return { mode, value };
}

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT p.id, p.name, p.slug, p.description, p.price, p.dimensions,
               p.finition, p.essence, p.is_published, p.position, p.created_at,
               p.deposit_mode, p.deposit_value,
               p.category_id, c.name AS category_name, c.slug AS category_slug,
               pc.name AS section_name,
               (SELECT pi.url FROM product_images pi
                 WHERE pi.product_id = p.id AND pi.media_type = 'image'
                 ORDER BY pi.is_main DESC, pi.position, pi.id LIMIT 1) AS main_image_url,
               (SELECT COUNT(*)::int FROM product_images pi
                 WHERE pi.product_id = p.id AND pi.media_type = 'image') AS image_count,
               (SELECT COUNT(*)::int FROM product_images pi
                 WHERE pi.product_id = p.id AND pi.media_type = 'video') AS video_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN categories pc ON pc.id = c.parent_id
        ORDER BY p.position, p.created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || '').trim().slice(0, 200);
      if (!name) return res.status(400).json({ error: 'Nom du produit requis' });

      const categoryId = Number(body.categoryId) || null;
      const price = Math.max(0, Math.round(Number(body.price) || 0));
      const { mode: depositMode, value: depositValue } = parseDeposit(body);
      const slug = await uniqueSlug('products', name);

      const [row] = await sql`
        INSERT INTO products (category_id, name, slug, description, price, dimensions, finition, essence, is_published, position, deposit_mode, deposit_value)
        VALUES (
          ${categoryId},
          ${name},
          ${slug},
          ${String(body.description || '').slice(0, 5000)},
          ${price},
          ${String(body.dimensions || '').slice(0, 300)},
          ${String(body.finition || '').slice(0, 300)},
          ${String(body.essence || '').slice(0, 300)},
          ${body.isPublished !== false},
          ${Number(body.position) || 0},
          ${depositMode},
          ${depositValue}
        )
        RETURNING id, name, slug, deposit_mode, deposit_value, created_at
      `;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('products error:', err);
    return res.status(500).json({ error: 'Erreur produits' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/products/[id].ts ─────────────────────────
export const productItem = (() => {
// ══════════════════════════════════════════════════════════════════
// GET    /api/admin/products/[id] — détail complet + médias
// PUT    /api/admin/products/[id] — mise à jour des champs
//         (incl. depositMode/depositValue : acompte personnalisable)
// DELETE /api/admin/products/[id] — supprime produit + médias (Blob inclus)
// ══════════════════════════════════════════════════════════════════

const DEPOSIT_MODES = ['percent', 'fixed', 'none'];

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'GET') {
      const [p] = await sql`
        SELECT p.*, c.name AS category_name, pc.name AS section_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN categories pc ON pc.id = c.parent_id
        WHERE p.id = ${id}
      `;
      if (!p) return res.status(404).json({ error: 'Produit introuvable' });
      const images = await sql`
        SELECT id, url, media_type, is_main, position FROM product_images
        WHERE product_id = ${id} ORDER BY is_main DESC, position, id
      `;
      return res.status(200).json({ ...p, images });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      const name = body.name !== undefined ? String(body.name).trim().slice(0, 200) : undefined;
      if (name !== undefined && !name) return res.status(400).json({ error: 'Nom invalide' });

      const categoryId =
        body.categoryId !== undefined ? (Number(body.categoryId) || null) : undefined;
      const price = body.price !== undefined ? Math.max(0, Math.round(Number(body.price) || 0)) : undefined;
      const description = body.description !== undefined ? String(body.description).slice(0, 5000) : undefined;
      const dimensions = body.dimensions !== undefined ? String(body.dimensions).slice(0, 300) : undefined;
      const finition = body.finition !== undefined ? String(body.finition).slice(0, 300) : undefined;
      const essence = body.essence !== undefined ? String(body.essence).slice(0, 300) : undefined;
      const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : undefined;
      const position = body.position !== undefined ? Number(body.position) || 0 : undefined;

      // Acompte personnalisable : mode et valeur (% ou GNF) sont
      // modifiables indépendamment l'un de l'autre
      const depositMode = body.depositMode !== undefined
        ? (DEPOSIT_MODES.includes(body.depositMode) ? body.depositMode : 'percent')
        : undefined;
      const depositValue = body.depositValue !== undefined
        ? Math.max(0, Math.round(Number(body.depositValue) || 0))
        : undefined;

      const slug = name !== undefined ? await uniqueSlug('products', name, id) : undefined;

      const [row] = await sql`
        UPDATE products SET
          name = COALESCE(${name ?? null}, name),
          category_id = COALESCE(${categoryId ?? null}, category_id),
          price = COALESCE(${price ?? null}, price),
          description = COALESCE(${description ?? null}, description),
          dimensions = COALESCE(${dimensions ?? null}, dimensions),
          finition = COALESCE(${finition ?? null}, finition),
          essence = COALESCE(${essence ?? null}, essence),
          is_published = COALESCE(${isPublished ?? null}, is_published),
          position = COALESCE(${position ?? null}, position),
          deposit_mode = COALESCE(${depositMode ?? null}, deposit_mode),
          deposit_value = COALESCE(${depositValue ?? null}, deposit_value),
          slug = COALESCE(${slug ?? null}, slug),
          updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Produit introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const images = await sql`SELECT url FROM product_images WHERE product_id = ${id}`;
      const [row] = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Produit introuvable' });

      // Nettoyage des blobs associés (best-effort)
      const urls = images.map((i: any) => i.url).filter((u: string) => u.includes('.blob.'));
      if (urls.length > 0) {
        try { await del(urls); } catch (e) { console.error('blob del error:', e); }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('product [id] error:', err);
    return res.status(500).json({ error: 'Erreur produit' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/products/[id]/images.ts ─────────────────────────
export const productImages = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/admin/products/[id]/images — ajoute un média (URL Blob)
//   { url, mediaType? } — mediaType 'image' (défaut) ou 'video'
//   Seule la première IMAGE devient principale (jamais une vidéo).
// PUT /api/admin/products/[id]/images — réordonne / définit principale
//   { order: [mediaId,...], mainImageId? } — mainImageId doit être une image
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const productId = Number(req.query.id);
  if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const url = String(body.url || '').trim();
      const mediaType = body.mediaType === 'video' ? 'video' : 'image';
      if (!/^https?:\/\//.test(url) && !url.startsWith('/')) {
        return res.status(400).json({ error: 'URL invalide' });
      }

      const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count FROM product_images
        WHERE product_id = ${productId} AND media_type = 'image'
      `;
      // La première image devient la principale ; une vidéo jamais
      const isMain = mediaType === 'image' && count === 0;

      const [row] = await sql`
        INSERT INTO product_images (product_id, url, media_type, is_main, position)
        VALUES (${productId}, ${url.slice(0, 1000)}, ${mediaType}, ${isMain},
                (SELECT COALESCE(MAX(position) + 1, 0) FROM product_images WHERE product_id = ${productId}))
        RETURNING id, url, media_type, is_main, position
      `;
      return res.status(201).json(row);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      if (Array.isArray(body.order)) {
        const ids: number[] = body.order.map((n: any) => Number(n)).filter(Number.isInteger);
        for (let pos = 0; pos < ids.length; pos++) {
          await sql`
            UPDATE product_images SET position = ${pos}
            WHERE id = ${ids[pos]} AND product_id = ${productId}
          `;
        }
      }

      if (body.mainImageId !== undefined && body.mainImageId !== null) {
        const mainId = Number(body.mainImageId);
        // Vérifie que le média désigné est bien une IMAGE de ce produit
        const [target] = await sql`
          SELECT id FROM product_images
          WHERE id = ${mainId} AND product_id = ${productId} AND media_type = 'image'
          LIMIT 1
        `;
        if (!target) {
          return res.status(400).json({ error: "L'image principale doit être une image (pas une vidéo)." });
        }
        await sql`UPDATE product_images SET is_main = false WHERE product_id = ${productId}`;
        await sql`UPDATE product_images SET is_main = true WHERE id = ${mainId} AND product_id = ${productId}`;
      }

      const images = await sql`
        SELECT id, url, media_type, is_main, position FROM product_images
        WHERE product_id = ${productId} ORDER BY is_main DESC, position, id
      `;
      return res.status(200).json(images);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('product images error:', err);
    return res.status(500).json({ error: "Erreur médias du produit" });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/images/[imageId].ts ─────────────────────────
export const imageItem = (() => {
// ══════════════════════════════════════════════════════════════════
// DELETE /api/admin/images/[imageId] — retire une image produit
// (supprime la ligne + le fichier Vercel Blob associé)
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const imageId = Number(req.query.imageId);
  if (!Number.isInteger(imageId) || imageId <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();
    const [row] = await sql`
      DELETE FROM product_images WHERE id = ${imageId}
      RETURNING url, product_id, is_main
    `;
    if (!row) return res.status(404).json({ error: 'Image introuvable' });

    // Si l'image supprimée était la principale → promouvoir l'image suivante
    // (une vidéo ne peut jamais devenir image principale)
    if (row.is_main) {
      await sql`
        UPDATE product_images SET is_main = true
        WHERE id = (
          SELECT id FROM product_images
          WHERE product_id = ${row.product_id} AND media_type = 'image'
          ORDER BY position, id LIMIT 1
        )
      `;
    }

    if (String(row.url).includes('.blob.')) {
      try { await del(row.url); } catch (e) { console.error('blob del error:', e); }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('image delete error:', err);
    return res.status(500).json({ error: "Erreur de suppression de l'image" });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/gallery.ts ─────────────────────────
export const gallery = (() => {
// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/gallery — tous les éléments (incl. masqués)
// POST /api/admin/gallery — { mediaType, url, title?, isPublished? }
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  try {
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, media_type, url, title, is_published, position, created_at
        FROM gallery_items ORDER BY position, created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const mediaType = body.mediaType === 'video' ? 'video' : 'image';
      const url = String(body.url || '').trim();
      if (!/^https?:\/\//.test(url) && !url.startsWith('/')) {
        return res.status(400).json({ error: 'URL invalide' });
      }

      const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM gallery_items`;
      const [row] = await sql`
        INSERT INTO gallery_items (media_type, url, title, is_published, position)
        VALUES (${mediaType}, ${url.slice(0, 1000)}, ${String(body.title || '').slice(0, 300)}, ${body.isPublished !== false}, ${count})
        RETURNING *
      `;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('gallery admin error:', err);
    return res.status(500).json({ error: 'Erreur galerie' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/gallery/[id].ts ─────────────────────────
export const galleryItem = (() => {
// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/gallery/[id] — { title?, isPublished?, position?, url? }
//   body.order global géré via PUT /api/admin/gallery/reorder
// DELETE /api/admin/gallery/[id] — supprime (Blob inclus)
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const title = body.title !== undefined ? String(body.title).slice(0, 300) : undefined;
      const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : undefined;
      const position = body.position !== undefined ? Number(body.position) || 0 : undefined;
      const url = body.url !== undefined ? String(body.url).slice(0, 1000) : undefined;

      const [row] = await sql`
        UPDATE gallery_items SET
          title = COALESCE(${title ?? null}, title),
          is_published = COALESCE(${isPublished ?? null}, is_published),
          position = COALESCE(${position ?? null}, position),
          url = COALESCE(${url ?? null}, url)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Élément introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM gallery_items WHERE id = ${id} RETURNING url`;
      if (!row) return res.status(404).json({ error: 'Élément introuvable' });
      if (String(row.url).includes('.blob.')) {
        try { await del(row.url); } catch (e) { console.error('blob del error:', e); }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('gallery [id] error:', err);
    return res.status(500).json({ error: 'Erreur galerie' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/gallery/reorder.ts ─────────────────────────
export const galleryReorder = (() => {
// ══════════════════════════════════════════════════════════════════
// PUT /api/admin/gallery/reorder — { order: [id, id, ...] }
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!Array.isArray(body.order)) return res.status(400).json({ error: 'Ordre manquant' });

    const sql = db();
    const ids: number[] = body.order.map((n: any) => Number(n)).filter(Number.isInteger);
    for (let pos = 0; pos < ids.length; pos++) {
      await sql`UPDATE gallery_items SET position = ${pos} WHERE id = ${ids[pos]}`;
    }
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('gallery reorder error:', err);
    return res.status(500).json({ error: 'Erreur de réordonnancement' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/leads.ts ─────────────────────────
export const leads = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/admin/leads — liste des prospects (?status=&q=)
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = db();
    const status = String(req.query.status || '');
    const q = String(req.query.q || '').trim().slice(0, 100);

    const validStatus = ['new', 'contacted', 'archived'].includes(status) ? status : null;
    const like = q ? `%${q}%` : null;

    const rows = await sql`
      SELECT id, first_name, last_name, phone, email, service_type, message, source, status, created_at
      FROM leads
      WHERE (${validStatus}::text IS NULL OR status = ${validStatus})
        AND (${like}::text IS NULL OR first_name ILIKE ${like} OR last_name ILIKE ${like}
             OR phone ILIKE ${like} OR email ILIKE ${like})
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return res.status(200).json(rows);
  } catch (err: any) {
    console.error('leads admin error:', err);
    return res.status(500).json({ error: 'Erreur prospects' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/leads/[id].ts ─────────────────────────
export const leadItem = (() => {
// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/leads/[id] — { status } (new|contacted|archived)
// DELETE /api/admin/leads/[id]
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const status = String(body.status || '');
      if (!['new', 'contacted', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      const [row] = await sql`
        UPDATE leads SET status = ${status} WHERE id = ${id} RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Prospect introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Prospect introuvable' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('lead [id] error:', err);
    return res.status(500).json({ error: 'Erreur prospect' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/orders.ts ─────────────────────────
export const orders = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/admin/orders — liste des commandes (?status=)
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = db();
    const status = String(req.query.status || '');
    const validStatus = ['pending', 'paid', 'cancelled', 'failed', 'refunded'].includes(status) ? status : null;

    const rows = await sql`
      SELECT id, reference, product_id, product_name, price_total, deposit_amount,
             paid_amount, customer_name, customer_phone, customer_address,
             payment_status, djomy_transaction_id, created_at, paid_at
      FROM orders
      WHERE (${validStatus}::text IS NULL OR payment_status = ${validStatus})
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return res.status(200).json(rows);
  } catch (err: any) {
    console.error('orders admin error:', err);
    return res.status(500).json({ error: 'Erreur commandes' });
  }
}

return handler;
})();

// ───────────────────────── routes/admin/orders/[id].ts ─────────────────────────
export const orderItem = (() => {
// ══════════════════════════════════════════════════════════════════
// PUT    /api/admin/orders/[id] — { paymentStatus } mise à jour manuelle
// DELETE /api/admin/orders/[id]
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const status = String(body.paymentStatus || '');
      if (!['pending', 'paid', 'cancelled', 'failed', 'refunded'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      const [row] = await sql`
        UPDATE orders
        SET payment_status = ${status},
            paid_at = CASE WHEN ${status} = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Commande introuvable' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const [row] = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`;
      if (!row) return res.status(404).json({ error: 'Commande introuvable' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('order [id] error:', err);
    return res.status(500).json({ error: 'Erreur commande' });
  }
}

return handler;
})();

// ───────────────────────── routes/public/catalogue.ts ─────────────────────────
export const catalogue = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/public/catalogue
// Remplace la lecture Google Drive : catégories (sections +
// sous-sections) et produits publiés avec image principale,
// vidéos, et règles d'acompte.
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
    const sql = db();

    const categories = await sql`
      SELECT c.id, c.name, c.slug, c.parent_id, c.position,
             p.name AS parent_name, p.slug AS parent_slug,
             (SELECT COUNT(*)::int FROM products pr
               WHERE pr.category_id = c.id AND pr.is_published) AS product_count
      FROM categories c
      LEFT JOIN categories p ON p.id = c.parent_id
      ORDER BY (COALESCE(p.position, c.position)), c.position, c.name
    `;

    const products = await sql`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.dimensions,
             p.finition, p.essence, p.deposit_mode, p.deposit_value,
             c.name AS category, c.slug AS category_slug,
             pc.name AS section_name, pc.slug AS section_slug,
             (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'image'
               ORDER BY pi.is_main DESC, pi.position, pi.id
               LIMIT 1) AS main_image_url,
             (SELECT COUNT(*)::int FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'image') AS image_count,
             (SELECT COUNT(*)::int FROM product_images pi
               WHERE pi.product_id = p.id AND pi.media_type = 'video') AS video_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories pc ON pc.id = c.parent_id
      WHERE p.is_published
      ORDER BY p.position, p.created_at DESC
    `;

    return res.status(200).json({
      categories: categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parent_id,
        parentName: c.parent_name,
        parentSlug: c.parent_slug,
        productCount: c.product_count,
      })),
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Divers',
        categorySlug: p.category_slug || 'divers',
        sectionName: p.section_name || p.category || 'Divers',
        sectionSlug: p.section_slug || p.category_slug || 'divers',
        modelSlug: p.slug,
        mainImageUrl: p.main_image_url || null,
        prix: p.price > 0 ? `${new Intl.NumberFormat('fr-FR').format(p.price)} GNF` : '',
        prixNumeric: Number(p.price),
        description: p.description || '',
        dimensions: p.dimensions || '',
        finition: p.finition || '',
        essence: p.essence || '',
        depositMode: p.deposit_mode,
        depositValue: Number(p.deposit_value),
        imageCount: p.image_count,
        videoCount: p.video_count,
      })),
    });
  } catch (err: any) {
    console.error('catalogue error:', err);
    return res.status(500).json({ error: 'Erreur de chargement du catalogue' });
  }
}

return handler;
})();

// ───────────────────────── routes/public/product/[categorySlug]/[modelSlug].ts ─────────────────────────
export const productPublic = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/public/product/[categorySlug]/[modelSlug]
// Détail d'un produit publié : images + vidéos + règle d'acompte.
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  const { categorySlug, modelSlug } = req.query;

  if (!categorySlug || !modelSlug) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    const sql = db();

    const rows = await sql`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.dimensions,
             p.finition, p.essence, p.deposit_mode, p.deposit_value,
             c.name AS category, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ${modelSlug}
        AND p.is_published
        AND (c.slug = ${categorySlug} OR ${categorySlug} = 'divers' AND c.slug IS NULL)
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    const p = rows[0];

    // Médias ordonnés : image principale d'abord, puis position
    const media = await sql`
      SELECT id, url, media_type FROM product_images
      WHERE product_id = ${p.id}
      ORDER BY is_main DESC, position, id
    `;

    return res.status(200).json({
      id: p.id,
      name: p.name,
      category: p.category || 'Divers',
      categorySlug: p.category_slug || 'divers',
      modelSlug: p.slug,
      prix: p.price > 0 ? `${new Intl.NumberFormat('fr-FR').format(p.price)} GNF` : 'Prix sur demande',
      prixNumeric: Number(p.price),
      description: p.description || '',
      dimensions: p.dimensions || '',
      finition: p.finition || '',
      essence: p.essence || '',
      depositMode: p.deposit_mode,
      depositValue: Number(p.deposit_value),
      images: media.map((m: any) => ({ id: m.id, url: m.url, mediaType: m.media_type })),
    });
  } catch (err: any) {
    console.error('product error:', err);
    return res.status(500).json({ error: 'Erreur de chargement du produit' });
  }
}

return handler;
})();

// ───────────────────────── routes/public/gallery.ts ─────────────────────────
export const galleryPublic = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/public/gallery
// Éléments publiés de la galerie (images + vidéos).
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
    const sql = db();
    const items = await sql`
      SELECT id, media_type, url, title
      FROM gallery_items
      WHERE is_published
      ORDER BY position, created_at DESC
    `;

    return res.status(200).json({
      images: items.filter((i: any) => i.media_type === 'image'),
      videos: items.filter((i: any) => i.media_type === 'video'),
    });
  } catch (err: any) {
    console.error('gallery error:', err);
    return res.status(500).json({ error: 'Erreur de chargement de la galerie' });
  }
}

return handler;
})();

// ───────────────────────── routes/public/settings.ts ─────────────────────────
export const settingsPublic = (() => {
// ══════════════════════════════════════════════════════════════════
// GET /api/public/settings
// Tous les paramètres du site, fusionnés sur les valeurs par défaut.
// ⚠️ Les clés sensibles (smtp, adminPassword) ne sont JAMAIS exposées.
// ══════════════════════════════════════════════════════════════════

const SENSITIVE_KEYS = ['smtp', 'adminPassword'];

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');

  try {
    let stored: Record<string, any> = {};
    try {
      stored = await getAllSettings();
    } catch {
      // Base indisponible → on sert les défauts pour que le site reste en ligne
    }

    // Fusion profonde simple : les valeurs en base écrasent les défauts
    const merged: Record<string, any> = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS as Record<string, any>)) {
      if (SENSITIVE_KEYS.includes(key)) continue;
      if (stored[key] !== undefined && stored[key] !== null) {
        const dv = (DEFAULT_SETTINGS as Record<string, any>)[key];
        merged[key] =
          dv && typeof dv === 'object' && !Array.isArray(dv) && stored[key] && typeof stored[key] === 'object' && !Array.isArray(stored[key])
            ? { ...dv, ...stored[key] }
            : stored[key];
      }
    }
    // Sections custom ajoutées par l'admin (hors défauts) — sauf sensibles
    for (const key of Object.keys(stored)) {
      if (!(key in merged) && !SENSITIVE_KEYS.includes(key)) merged[key] = stored[key];
    }

    return res.status(200).json(merged);
  } catch (err: any) {
    console.error('settings error:', err);
    return res.status(500).json({ error: 'Erreur de chargement des paramètres' });
  }
}

return handler;
})();

// ───────────────────────── routes/public/leads.ts ─────────────────────────
export const leadsPublic = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/public/leads
// Enregistre un prospect (formulaire contact / popup) en base.
// Remplace l'envoi vers Google Apps Script.
// Anti-spam : champ pot de miel "website" + limites de longueur.
// ══════════════════════════════════════════════════════════════════

const MAX = {
  firstName: 100, lastName: 100, phone: 40, email: 200,
  serviceType: 100, message: 3000, source: 100,
};

function clean(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Pot de miel : les robots remplissent le champ caché "website"
    if (clean(body.website, 200)) {
      // Réponse factice pour ne pas alerter le robot
      return res.status(200).json({ success: true });
    }

    const firstName = clean(body.firstName ?? body.prenom, MAX.firstName);
    const phone = clean(body.phone ?? body.telephone, MAX.phone);
    const email = clean(body.email, MAX.email);

    if (!firstName && !phone && !email) {
      return res.status(400).json({ error: 'Formulaire vide' });
    }

    const sql = db();
    await sql`
      INSERT INTO leads (first_name, last_name, phone, email, service_type, message, source)
      VALUES (
        ${firstName},
        ${clean(body.lastName ?? body.nom, MAX.lastName)},
        ${phone},
        ${email},
        ${clean(body.serviceType, MAX.serviceType)},
        ${clean(body.message, MAX.message)},
        ${clean(body.source ?? body.type, MAX.source)}
      )
    `;

    // Notification email (ne bloque jamais le flux principal)
    await sendNotification(
      `🆕 Nouveau prospect — ${firstName} ${clean(body.lastName ?? body.nom, MAX.lastName)}`.trim(),
      [
        ['Nom', `${firstName} ${clean(body.lastName ?? body.nom, MAX.lastName)}`.trim()],
        ['Téléphone', phone || '—'],
        ['Email', email || '—'],
        ['Service', clean(body.serviceType, MAX.serviceType) || '—'],
        ['Source', clean(body.source ?? body.type, MAX.source) || '—'],
        ['Message', clean(body.message, MAX.message) || '—'],
      ],
      { label: 'Voir dans le tableau de bord', url: `${process.env.VITE_PUBLIC_URL || ''}/admin/prospects` }
    ).catch(() => {});

    return res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('leads error:', err);
    return res.status(500).json({ error: "Erreur d'enregistrement de la demande" });
  }
}

return handler;
})();

// ───────────────────────── routes/public/orders.ts ─────────────────────────
export const ordersPublic = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/public/orders
// Commande SANS acompte en ligne (produits avec deposit_mode = 'none').
// La commande est enregistrée en base (statut pending, acompte 0) et
// le client confirme ensuite via WhatsApp.
// ══════════════════════════════════════════════════════════════════

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Pot de miel anti-spam
    if (clean(body.website, 200)) return res.status(200).json({ success: true });

    const productId = Number(body.productId);
    const nom = clean(body.nom, 120);
    const prenom = clean(body.prenom, 120);
    const telephone = clean(body.telephone, 40);
    const adresse = clean(body.adresse, 500);

    if (!Number.isInteger(productId) || productId <= 0 || !nom || !telephone) {
      return res.status(400).json({ error: 'Informations incomplètes' });
    }

    const sql = db();

    // 🔒 Seuls les produits avec paiement désactivé peuvent être
    // commandés par cette voie (impossible de contourner l'acompte)
    const [product] = await sql`
      SELECT id, name, price FROM products
      WHERE id = ${productId} AND is_published AND deposit_mode = 'none'
      LIMIT 1
    `;
    if (!product) {
      return res.status(400).json({ error: "Ce produit n'est pas commandable sans acompte en ligne." });
    }

    const reference = `EMROD-${Date.now()}`;
    await sql`
      INSERT INTO orders (reference, product_id, product_name, price_total, deposit_amount,
                          customer_name, customer_phone, customer_address, payment_status, metadata)
      VALUES (${reference}, ${product.id}, ${product.name}, ${Number(product.price) || 0}, 0,
              ${`${nom} ${prenom}`.trim()}, ${telephone}, ${adresse}, 'pending',
              ${JSON.stringify({ noDeposit: true, mode: 'none' })}::jsonb)
    `;

    // Notification email (ne bloque jamais le flux principal)
    const price = Number(product.price) || 0;
    await sendNotification(
      `🧾 Nouvelle commande sans acompte — ${product.name}`,
      [
        ['Référence', reference],
        ['Produit', product.name],
        ['Prix', price > 0 ? `${new Intl.NumberFormat('fr-FR').format(price)} GNF` : 'Sur devis'],
        ['Client', `${nom} ${prenom}`.trim()],
        ['Téléphone', telephone],
        ['Adresse', adresse || '—'],
        ['Paiement', 'Sans acompte en ligne — à organiser avec le client'],
      ],
      { label: 'Voir dans le tableau de bord', url: `${process.env.VITE_PUBLIC_URL || ''}/admin/commandes` }
    ).catch(() => {});

    return res.status(201).json({ success: true, reference });
  } catch (err: any) {
    console.error('public orders error:', err);
    return res.status(500).json({ error: "Erreur d'enregistrement de la commande" });
  }
}

return handler;
})();

// ───────────────────────── routes/payment/create.ts ─────────────────────────
export const paymentCreate = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/payment/create
// Initie un paiement Djomy pour l'acompte d'un produit.
//
// 🔒 SÉCURITÉ : le prix n'est JAMAIS fourni par le client.
// Le serveur lit le produit en base (Neon) et calcule l'acompte.
// La commande est créée en base AVANT la redirection (statut pending),
// puis mise à jour par le webhook signé Djomy.
// ══════════════════════════════════════════════════════════════════

function formatPhoneNumber(phone: string) {
  let clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+')) {
    clean = '00' + clean.substring(1);
  } else if (clean.startsWith('224')) {
    clean = '00' + clean;
  } else if (clean.startsWith('6')) {
    clean = '00224' + clean;
  }
  return clean;
}

function generateHmac(stringToSign: string, clientSecret: string) {
  return crypto.createHmac('sha256', clientSecret).update(stringToSign).digest('hex');
}

async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { productId, payerNumber } = body;
    const nom = String(body.nom || '').slice(0, 120);
    const prenom = String(body.prenom || '').slice(0, 120);
    const telephone = String(body.telephone || payerNumber || '').slice(0, 40);
    const adresse = String(body.adresse || '').slice(0, 500);

    if (!payerNumber || !nom) {
      return res.status(400).json({ error: 'Informations client incomplètes' });
    }

    const API_URL = 'https://api.djomy.africa';
    const clientId = process.env.DJOMY_CLIENT_ID;
    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    const partnerDomain = process.env.DJOMY_PARTNER_DOMAIN;
    const baseUrl = process.env.VITE_PUBLIC_URL || 'https://emrod.vercel.app';

    if (!clientId || !clientSecret) throw new Error('Clés API Djomy non configurées');
    if (!partnerDomain) throw new Error('DJOMY_PARTNER_DOMAIN non configuré');

    // ── 1. Produit + prix AUTHENTIQUE depuis la base ───────────────
    const sql = db();
    const [product] = await sql`
      SELECT id, name, price, deposit_mode, deposit_value FROM products
      WHERE id = ${Number(productId)} AND is_published
      LIMIT 1
    `;
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable ou non disponible' });
    }
    const priceTotal = Number(product.price);
    if (!priceTotal || priceTotal <= 0) {
      return res.status(400).json({
        error: "Ce produit n'a pas de prix défini ou est sur devis. Le paiement en ligne n'est pas possible.",
      });
    }

    // ── 2. Acompte selon la règle DU PRODUIT (%, fixe, ou désactivé) ─
    // computeDeposit retourne null si le paiement est désactivé (mode 'none')
    const acompteCalcule = computeDeposit(priceTotal, product.deposit_mode, Number(product.deposit_value));
    if (acompteCalcule === null || acompteCalcule <= 0) {
      return res.status(400).json({
        error: "Le paiement en ligne est désactivé pour ce produit. La commande se fait directement auprès de l'atelier.",
      });
    }

    // ── 3. Création de la commande en base (pending) ───────────────
    const reference = `EMROD-${Date.now()}`;
    const [order] = await sql`
      INSERT INTO orders (reference, product_id, product_name, price_total, deposit_amount,
                          customer_name, customer_phone, customer_address, payment_status)
      VALUES (${reference}, ${product.id}, ${product.name}, ${priceTotal}, ${acompteCalcule},
              ${`${nom} ${prenom}`.trim()}, ${telephone}, ${adresse}, 'pending')
      RETURNING id, reference
    `;

    // ── 4. Authentification Djomy ─────────────────────────────────
    const signature = generateHmac(clientId, clientSecret);
    const apiKeyHeader = `${clientId}:${signature}`;

    const authResponse = await fetch(`${API_URL}/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKeyHeader,
        'X-PARTNER-DOMAIN': partnerDomain,
      },
    });
    if (!authResponse.ok) {
      const authErr = await authResponse.text();
      console.error('Auth error:', authErr);
      await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${order.id}`;
      return res.status(500).json({ error: 'Erreur authentification Djomy', details: authErr });
    }
    const authData = await authResponse.json();
    const token = authData.data?.token || authData.data?.accessToken;
    if (!token) {
      await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${order.id}`;
      return res.status(500).json({ error: 'Jeton manquant dans la réponse', details: authData });
    }

    // ── 5. Création du lien de paiement ───────────────────────────
    const djomyPayload = {
      amount: acompteCalcule,
      countryCode: 'GN',
      payerNumber: formatPhoneNumber(payerNumber),
      description: `Acompte - ${product.name}`,
      merchantPaymentReference: reference,
      returnUrl: `${baseUrl}/payment/success?ref=${reference}`,
      cancelUrl: `${baseUrl}/payment/cancel?ref=${reference}`,
      metadata: { orderId: String(order.id), productId: String(product.id) },
    };

    const paymentResponse = await fetch(`${API_URL}/v1/payments/gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKeyHeader,
        'X-PARTNER-DOMAIN': partnerDomain,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(djomyPayload),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error('Payment error:', errorData);
      await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${order.id}`;
      return res.status(500).json({ error: 'Erreur création paiement Djomy', details: errorData });
    }

    const paymentData = await paymentResponse.json();
    const redirectUrl = paymentData.data?.redirectUrl || paymentData.data?.paymentUrl || paymentData.data?.url;
    const transactionId = paymentData.data?.transactionId || paymentData.data?.id || '';

    // Sauvegarde de l'ID de transaction pour le suivi
    if (transactionId) {
      await sql`UPDATE orders SET djomy_transaction_id = ${String(transactionId)} WHERE id = ${order.id}`;
    }

    return res.status(200).json({
      success: true,
      redirectUrl,
      reference: order.reference,
      transactionId,
    });
  } catch (error: any) {
    console.error('Erreur générale :', error);
    return res.status(500).json({ error: error.message });
  }
}

return handler;
})();

// ───────────────────────── routes/payment/webhook.ts ─────────────────────────
export const paymentWebhook = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/payment/webhook
// Webhook Djomy : valide la signature HMAC sur le raw body, puis met
// à jour la commande correspondante en base (statut + montant payé).
// Plus aucun appel Google Apps Script.
// ══════════════════════════════════════════════════════════════════

// Désactive le parseur par défaut de Vercel pour lire le flux brut
// (indispensable : la signature HMAC doit porter sur le corps exact)
const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ── 1. Validation de la signature ─────────────────────────────
    const signatureHeader = req.headers['x-webhook-signature'];
    if (!signatureHeader) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    if (!clientSecret) throw new Error('Missing Client Secret');

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');

    const providedSignature = String(signatureHeader).replace('v1:', '');
    const expectedSignature = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex');

    const a = Buffer.from(providedSignature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error('Signature invalide! Reçue:', providedSignature, 'Attendue:', expectedSignature);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // ── 2. Traitement de l'événement authentifié ─────────────────
    const parsedBody = JSON.parse(rawBody);
    const { eventType, data } = parsedBody;
    const sql = db();

    // Retrouver la commande via la référence marchand (jamais via des
    // données client falsifiables)
    const reference =
      parsedBody.merchantPaymentReference ||
      data?.merchantPaymentReference ||
      data?.metadata?.merchantPaymentReference ||
      data?.reference;

    if (!reference) {
      console.error('Webhook sans référence de commande:', parsedBody);
      return res.status(200).json({ success: true }); // ACK pour éviter les rejeux
    }

    if (eventType === 'payment.success') {
      const actualPaid = Number(data?.paidAmount || data?.amount || 0);

      // ⚠️ On ne joint jamais sur un ID de transaction vide (toutes les
      // commandes démarrent avec un ID vide → risque de mauvaise correspondance)
      const tid = String(data?.transactionId || data?.id || '');
      const [order] = tid
        ? await sql`
            SELECT id, deposit_amount, price_total, payment_status FROM orders
            WHERE reference = ${String(reference)} OR djomy_transaction_id = ${tid}
            LIMIT 1
          `
        : await sql`
            SELECT id, deposit_amount, price_total, payment_status FROM orders
            WHERE reference = ${String(reference)}
            LIMIT 1
          `;

      if (!order) {
        console.error('Webhook: commande introuvable pour référence', reference);
        return res.status(200).json({ success: true });
      }

      if (order.payment_status === 'paid') {
        return res.status(200).json({ success: true }); // déjà traité (idempotence)
      }

      // ⚠️ Contrôle anti-fraude : le montant payé doit couvrir l'acompte attendu
      if (actualPaid < order.deposit_amount) {
        console.error(
          `⚠️ ALERTE FRAUDE : commande ${reference} — payé ${actualPaid} GNF < acompte attendu ${order.deposit_amount} GNF`
        );
        await sql`
          UPDATE orders SET payment_status = 'failed', paid_amount = ${actualPaid},
            metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{fraudAlert}', 'true'::jsonb)
          WHERE id = ${order.id}
        `;
        // Notification email d'alerte (ne bloque jamais le flux)
        sendNotification(
          `🚨 ALERTE FRAUDE — commande ${reference}`,
          [
            ['Référence', String(reference)],
            ['Montant payé', `${new Intl.NumberFormat('fr-FR').format(actualPaid)} GNF`],
            ['Acompte attendu', `${new Intl.NumberFormat('fr-FR').format(order.deposit_amount)} GNF`],
            ['Écart', `${new Intl.NumberFormat('fr-FR').format(order.deposit_amount - actualPaid)} GNF`],
            ['Statut', 'Commande marquée ÉCHOUÉE — à vérifier avant production'],
          ],
          { label: 'Examiner la commande', url: `${process.env.VITE_PUBLIC_URL || ''}/admin/commandes` }
        ).catch(() => {});
        return res.status(200).json({ success: true });
      }

      // Détails client pour la notification (source fiable : la base)
      const [orderInfo] = await sql`
        SELECT o.product_name, o.customer_name, o.customer_phone FROM orders o WHERE o.id = ${order.id}
      `;

      await sql`
        UPDATE orders
        SET payment_status = 'paid', paid_amount = ${actualPaid}, paid_at = now(),
            djomy_transaction_id = COALESCE(NULLIF(${String(data?.transactionId || data?.id || '')}, ''), djomy_transaction_id)
        WHERE id = ${order.id}
      `;
      console.log(`✅ Commande ${reference} marquée PAYÉE (${actualPaid} GNF).`);

      // Notification email de paiement reçu (ne bloque jamais le flux)
      sendNotification(
        `💰 Acompte reçu — ${reference}`,
        [
          ['Référence', String(reference)],
          ['Produit', orderInfo?.product_name || '—'],
          ['Montant encaissé', `${new Intl.NumberFormat('fr-FR').format(actualPaid)} GNF`],
          ['Client', orderInfo?.customer_name || '—'],
          ['Téléphone', orderInfo?.customer_phone || '—'],
        ],
        { label: 'Voir la commande', url: `${process.env.VITE_PUBLIC_URL || ''}/admin/commandes` }
      ).catch(() => {});
    } else if (eventType === 'payment.failed' || eventType === 'payment.cancelled') {
      await sql`
        UPDATE orders SET payment_status = ${eventType === 'payment.failed' ? 'failed' : 'cancelled'}
        WHERE reference = ${String(reference)} AND payment_status = 'pending'
      `;
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}

return handler;
})();

// ───────────────────────── routes/blob-upload.ts ─────────────────────────
export const blobUpload = (() => {
// ══════════════════════════════════════════════════════════════════
// POST /api/vercel/blob/upload — autorisation d'upload direct
// navigateur → Vercel Blob (protégée par la session admin).
// Le front utilise upload() de @vercel/blob/client qui appelle
// automatiquement cette route.
// ══════════════════════════════════════════════════════════════════

async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'application/pdf',
        ],
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 Mo (vidéos)
        tokenPayload: JSON.stringify({ role: 'admin' }),
      }),
      onUploadCompleted: async () => {
        // Pas de traitement supplémentaire nécessaire (le front enregistre l'URL en base)
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err: any) {
    console.error('blob upload error:', err);
    return res.status(500).json({ error: "Erreur d'autorisation d'upload" });
  }
}

return handler;
})();

// ───────────────────────── distribution ─────────────────────────
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

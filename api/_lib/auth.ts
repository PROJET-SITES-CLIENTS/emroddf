// ══════════════════════════════════════════════════════════════════
// Authentification administrateur — compte unique + cookie signé HMAC
//
// Mot de passe (priorité décroissante) :
//   1. Mot de passe défini depuis le tableau de bord (Mon compte) —
//      stocké haché (scrypt + sel) dans settings.key = 'adminPassword'
//   2. Variable d'environnement ADMIN_PASSWORD (mot de passe initial)
// ══════════════════════════════════════════════════════════════════
import crypto from 'crypto';
import { db, setSetting } from './db';

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

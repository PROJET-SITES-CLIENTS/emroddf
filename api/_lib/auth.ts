// ══════════════════════════════════════════════════════════════════
// Authentification administrateur — compte unique + cookie signé HMAC
// ══════════════════════════════════════════════════════════════════
import crypto from 'crypto';

const COOKIE_NAME = 'emrod_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 heures

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

// ── Vérification des identifiants admin ────────────────────────────
export function checkCredentials(email: string, password: string): boolean {
  const envEmail = process.env.ADMIN_EMAIL || '';
  const envPassword = process.env.ADMIN_PASSWORD || '';
  if (!envEmail || !envPassword) return false;
  return safeEqual(email.trim().toLowerCase(), envEmail.toLowerCase()) && safeEqual(password, envPassword);
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

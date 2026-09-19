// ══════════════════════════════════════════════════════════════════
// Accès base de données Neon PostgreSQL — pilote postgres.js (TCP)
//
// NB : le pilote @neondatabase/serverless crashait dans le runtime
// de production Vercel (résolution "navigateur" du paquet par leur
// bundler). postgres.js est un pilote Node pur, compatible Vercel
// Functions, avec la même API de templates tagués.
// ══════════════════════════════════════════════════════════════════
import postgres from 'postgres';

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

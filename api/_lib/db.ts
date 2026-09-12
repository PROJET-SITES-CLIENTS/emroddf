// ══════════════════════════════════════════════════════════════════
// Accès base de données Neon PostgreSQL (driver serverless HTTP)
// ══════════════════════════════════════════════════════════════════
import { neon } from '@neondatabase/serverless';

// Le client Neon est typé de façon très large ; on l'assume ici comme
// une fonction template retournant des lignes typées `any[]`.
export type SqlClient = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;

let cachedClient: SqlClient | null = null;

export function db(): SqlClient {
  if (!cachedClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL non configurée');
    cachedClient = neon(url) as unknown as SqlClient;
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

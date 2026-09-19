// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/gallery — tous les éléments (incl. masqués)
// POST /api/admin/gallery — { mediaType, url, title?, isPublished? }
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../lib/auth';
import { db } from '../../lib/db';

export default async function handler(req: any, res: any) {
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

// ══════════════════════════════════════════════════════════════════
// GET /api/public/gallery
// Éléments publiés de la galerie (images + vidéos).
// ══════════════════════════════════════════════════════════════════
import { db } from '../../lib/db';

export default async function handler(req: any, res: any) {
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

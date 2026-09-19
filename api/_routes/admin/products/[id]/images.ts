// ══════════════════════════════════════════════════════════════════
// POST /api/admin/products/[id]/images — ajoute un média (URL Blob)
//   { url, mediaType? } — mediaType 'image' (défaut) ou 'video'
//   Seule la première IMAGE devient principale (jamais une vidéo).
// PUT /api/admin/products/[id]/images — réordonne / définit principale
//   { order: [mediaId,...], mainImageId? } — mainImageId doit être une image
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../../../_lib/auth';
import { db } from '../../../../_lib/db';

export default async function handler(req: any, res: any) {
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

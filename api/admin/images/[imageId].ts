// ══════════════════════════════════════════════════════════════════
// DELETE /api/admin/images/[imageId] — retire une image produit
// (supprime la ligne + le fichier Vercel Blob associé)
// ══════════════════════════════════════════════════════════════════
import { del } from '@vercel/blob';
import { requireAdmin } from '../../_lib/auth';
import { db } from '../../_lib/db';

export default async function handler(req: any, res: any) {
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

    // Si l'image supprimée était la principale → promouvoir la suivante
    if (row.is_main) {
      await sql`
        UPDATE product_images SET is_main = true
        WHERE id = (
          SELECT id FROM product_images
          WHERE product_id = ${row.product_id}
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

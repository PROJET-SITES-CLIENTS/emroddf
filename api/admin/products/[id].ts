// ══════════════════════════════════════════════════════════════════
// GET    /api/admin/products/[id] — détail complet + images
// PUT    /api/admin/products/[id] — mise à jour des champs
// DELETE /api/admin/products/[id] — supprime produit + images (Blob inclus)
// ══════════════════════════════════════════════════════════════════
import { del } from '@vercel/blob';
import { requireAdmin } from '../../_lib/auth';
import { db, uniqueSlug } from '../../_lib/db';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID invalide' });

  try {
    const sql = db();

    if (req.method === 'GET') {
      const [p] = await sql`
        SELECT p.*, c.name AS category_name
        FROM products p LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ${id}
      `;
      if (!p) return res.status(404).json({ error: 'Produit introuvable' });
      const images = await sql`
        SELECT id, url, is_main, position FROM product_images
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

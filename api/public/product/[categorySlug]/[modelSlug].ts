// ══════════════════════════════════════════════════════════════════
// GET /api/public/product/[categorySlug]/[modelSlug]
// Détail d'un produit publié : images + vidéos + règle d'acompte.
// ══════════════════════════════════════════════════════════════════
import { db } from '../../../_lib/db';

export default async function handler(req: any, res: any) {
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

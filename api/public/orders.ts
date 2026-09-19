// ══════════════════════════════════════════════════════════════════
// POST /api/public/orders
// Commande SANS acompte en ligne (produits avec deposit_mode = 'none').
// La commande est enregistrée en base (statut pending, acompte 0) et
// le client confirme ensuite via WhatsApp.
// ══════════════════════════════════════════════════════════════════
import { db } from '../_lib/db';
import { sendNotification } from '../_lib/mailer';

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Pot de miel anti-spam
    if (clean(body.website, 200)) return res.status(200).json({ success: true });

    const productId = Number(body.productId);
    const nom = clean(body.nom, 120);
    const prenom = clean(body.prenom, 120);
    const telephone = clean(body.telephone, 40);
    const adresse = clean(body.adresse, 500);

    if (!Number.isInteger(productId) || productId <= 0 || !nom || !telephone) {
      return res.status(400).json({ error: 'Informations incomplètes' });
    }

    const sql = db();

    // 🔒 Seuls les produits avec paiement désactivé peuvent être
    // commandés par cette voie (impossible de contourner l'acompte)
    const [product] = await sql`
      SELECT id, name, price FROM products
      WHERE id = ${productId} AND is_published AND deposit_mode = 'none'
      LIMIT 1
    `;
    if (!product) {
      return res.status(400).json({ error: "Ce produit n'est pas commandable sans acompte en ligne." });
    }

    const reference = `EMROD-${Date.now()}`;
    await sql`
      INSERT INTO orders (reference, product_id, product_name, price_total, deposit_amount,
                          customer_name, customer_phone, customer_address, payment_status, metadata)
      VALUES (${reference}, ${product.id}, ${product.name}, ${Number(product.price) || 0}, 0,
              ${`${nom} ${prenom}`.trim()}, ${telephone}, ${adresse}, 'pending',
              ${JSON.stringify({ noDeposit: true, mode: 'none' })}::jsonb)
    `;

    // Notification email (ne bloque jamais le flux principal)
    const price = Number(product.price) || 0;
    await sendNotification(
      `🧾 Nouvelle commande sans acompte — ${product.name}`,
      [
        ['Référence', reference],
        ['Produit', product.name],
        ['Prix', price > 0 ? `${new Intl.NumberFormat('fr-FR').format(price)} GNF` : 'Sur devis'],
        ['Client', `${nom} ${prenom}`.trim()],
        ['Téléphone', telephone],
        ['Adresse', adresse || '—'],
        ['Paiement', 'Sans acompte en ligne — à organiser avec le client'],
      ],
      { label: 'Voir dans le tableau de bord', url: `${process.env.VITE_PUBLIC_URL || ''}/admin/commandes` }
    ).catch(() => {});

    return res.status(201).json({ success: true, reference });
  } catch (err: any) {
    console.error('public orders error:', err);
    return res.status(500).json({ error: "Erreur d'enregistrement de la commande" });
  }
}

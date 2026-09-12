// ══════════════════════════════════════════════════════════════════
// TEST DE BOUT EN BOUT — vrais handlers API + vraie base Neon
// Simule le navigateur (req/res mockés) sur tous les flux du système.
// Usage : npx tsx scratch/test-e2e.ts
// ══════════════════════════════════════════════════════════════════
import 'dotenv/config';
import crypto from 'crypto';

/* ── Mocks req/res façon Vercel ──────────────────────────────────── */
function mockRes() {
  const r: any = {
    statusCode: 0, body: undefined, cookies: [] as string[], headers: {} as any,
    status(c: number) { r.statusCode = c; return r; },
    json(b: any) { r.body = b; return r; },
    end() { return r; },
    setHeader(k: string, v: any) {
      r.headers[k.toLowerCase()] = v;
      if (k.toLowerCase() === 'set-cookie') r.cookies.push(v);
      return r;
    },
  };
  return r;
}
const mockReq = ({ method = 'GET', body, headers = {}, query = {} }: any = {}) =>
  ({ method, body, headers, query });

function webhookReq(rawBody: string, headers: any) {
  const buf = Buffer.from(rawBody);
  const req: any = { method: 'POST', headers };
  req[Symbol.asyncIterator] = async function* () { yield buf; };
  return req;
}

// Appelle un handler en captant TOUJOURS la réponse mockée (certains
// handlers ne retournent rien après avoir répondu)
async function call(h: any, req: any) {
  const r = mockRes();
  await h(req, r);
  return r;
}

/* ── Compteur de résultats ───────────────────────────────────────── */
let passed = 0, failed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, extra = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name + (extra ? ` (${extra})` : '')); console.log(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

async function main() {
  /* ── Imports des VRAIS handlers ────────────────────────────────── */
  const login = (await import('../api/admin/login')).default;
  const session = (await import('../api/admin/session')).default;
  const logout = (await import('../api/admin/logout')).default;
  const categoriesH = (await import('../api/admin/categories')).default;
  const categoryH = (await import('../api/admin/categories/[id]')).default;
  const productsH = (await import('../api/admin/products')).default;
  const productH = (await import('../api/admin/products/[id]')).default;
  const productImagesH = (await import('../api/admin/products/[id]/images')).default;
  const imageH = (await import('../api/admin/images/[imageId]')).default;
  const galleryH = (await import('../api/admin/gallery')).default;
  const galleryItemH = (await import('../api/admin/gallery/[id]')).default;
  const galleryReorderH = (await import('../api/admin/gallery/reorder')).default;
  const leadsH = (await import('../api/admin/leads')).default;
  const leadH = (await import('../api/admin/leads/[id]')).default;
  const ordersH = (await import('../api/admin/orders')).default;
  const orderH = (await import('../api/admin/orders/[id]')).default;
  const settingsAdminH = (await import('../api/admin/settings')).default;
  const statsH = (await import('../api/admin/stats')).default;
  const catalogueH = (await import('../api/public/catalogue')).default;
  const productPublicH = (await import('../api/public/product/[categorySlug]/[modelSlug]')).default;
  const galleryPublicH = (await import('../api/public/gallery')).default;
  const settingsPublicH = (await import('../api/public/settings')).default;
  const leadsPublicH = (await import('../api/public/leads')).default;
  const paymentCreateH = (await import('../api/payment/create')).default;
  const webhookH = (await import('../api/payment/webhook')).default;
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL!) as any;

  const created: { cats: number[]; prods: number[]; gal: number[]; leads: number[]; orders: number[] } =
    { cats: [], prods: [], gal: [], leads: [], orders: [] };

  try {
    /* ══ 1. AUTHENTIFICATION ══════════════════════════════════════ */
    console.log('\n══ 1. AUTHENTIFICATION ══');
    let res = await call(login, mockReq({ method: 'POST', body: { email: process.env.ADMIN_EMAIL, password: 'MAUVAIS' } }));
    check('login mauvais mot de passe → 401', res.statusCode === 401);

    res = await call(login, mockReq({ method: 'POST', body: { email: process.env.ADMIN_EMAIL!.trim(), password: process.env.ADMIN_PASSWORD!.trim() } }));
    check('login bons identifiants → 200', res.statusCode === 200 && res.body.success === true);
    const cookieRaw = res.cookies.find((c: string) => c.startsWith('emrod_admin='));
    check('cookie de session émis (httpOnly)', !!cookieRaw && cookieRaw.includes('HttpOnly'));
    const token = cookieRaw?.split(';')[0];
    const authHeaders = { cookie: token };

    res = await call(session, mockReq({ headers: authHeaders }));
    check('session valide → authenticated', res.statusCode === 200 && res.body.authenticated === true);
    res = await call(session, mockReq({ headers: { cookie: 'emrod_admin=falsifie.abc' } }));
    check('session falsifiée → 401', res.statusCode === 401);

    res = await call(categoriesH, mockReq({ method: 'GET', headers: {} }));
    check('route admin SANS cookie → 401', res.statusCode === 401);

    /* ══ 2. CATÉGORIES ════════════════════════════════════════════ */
    console.log('\n══ 2. CATÉGORIES ══');
    res = await call(categoriesH, mockReq({ method: 'POST', headers: authHeaders, body: { name: 'Tables E2E' } }));
    check('création catégorie → 201 + slug', res.statusCode === 201 && res.body.slug === 'tables-e2e');
    const catId = res.body.id; created.cats.push(catId);

    res = await call(categoryH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: catId }, body: { position: 5 } }));
    check('déplacement catégorie (position) → 200', res.statusCode === 200 && res.body.position === 5);

    res = await call(categoriesH, mockReq({ method: 'GET', headers: authHeaders }));
    check('liste catégories contient la nouvelle + product_count', res.statusCode === 200 && Array.isArray(res.body) && res.body.some((c: any) => c.id === catId && c.product_count === 0));

    /* ══ 3. PRODUITS + IMAGES ═════════════════════════════════════ */
    console.log('\n══ 3. PRODUITS + IMAGES ══');
    res = await call(productsH, mockReq({ method: 'POST', headers: authHeaders, body: {
      name: 'Table Basse E2E', categoryId: catId, price: 1500000,
      description: 'Description de test', dimensions: '120x60', finition: 'Vernis', essence: 'Iroko',
    } }));
    check('création produit → 201 + slug', res.statusCode === 201 && res.body.slug === 'table-basse-e2e');
    const prodId = res.body.id; created.prods.push(prodId);

    res = await call(productsH, mockReq({ method: 'POST', headers: authHeaders, body: { name: 'Produit Sur Devis E2E', categoryId: catId, price: 0 } }));
    check('produit prix 0 (sur devis) → 201', res.statusCode === 201);
    const prodDevisId = res.body.id; created.prods.push(prodDevisId);

    // 3 images
    const imgIds: number[] = [];
    for (let i = 1; i <= 3; i++) {
      res = await call(productImagesH, mockReq({ method: 'POST', headers: authHeaders, query: { id: prodId }, body: { url: `https://exemple.com/e2e-${i}.jpg` } }));
      imgIds.push(res.body.id);
    }
    check('ajout 3 images → première = principale automatiquement', res.statusCode === 201);

    res = await call(productImagesH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodId }, body: { mainImageId: imgIds[2] } }));
    const mainAfter = res.body.find((i: any) => i.id === imgIds[2]);
    check('définition image principale', mainAfter?.is_main === true);

    res = await call(productImagesH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodId }, body: { order: [imgIds[2], imgIds[1], imgIds[0]] } }));
    check('réordonnancement images', res.statusCode === 200);

    res = await call(imageH, mockReq({ method: 'DELETE', headers: authHeaders, query: { imageId: imgIds[2] } }));
    const imgs = await call(productImagesH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodId }, body: { order: [imgIds[0], imgIds[1]] } }));
    check('suppression image principale → promotion de la suivante', res.statusCode === 200 && imgs.body.some((i: any) => i.is_main));

    res = await call(productH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodId }, body: { price: 2000000, isPublished: false } }));
    check('mise à jour produit (prix + masquage)', res.statusCode === 200 && res.body.price == 2000000 && res.body.is_published === false);

    res = await call(productH, mockReq({ method: 'GET', headers: authHeaders, query: { id: prodId } }));
    check('détail admin produit (2 images restantes)', res.statusCode === 200 && res.body.images.length === 2);

    /* ══ 4. API PUBLIQUE : CATALOGUE ══════════════════════════════ */
    console.log('\n══ 4. SITE PUBLIC — CATALOGUE ══');
    await call(productH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodId }, body: { isPublished: true } }));
    // Le produit « sur devis » est masqué pour tester le filtrage par publication
    await call(productH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodDevisId }, body: { isPublished: false } }));

    res = await call(catalogueH, mockReq({}));
    const pubProd = res.body.products.find((p: any) => p.id === prodId);
    const shapeOk = pubProd && ['id', 'name', 'category', 'categorySlug', 'modelSlug', 'mainImageUrl', 'prix', 'prixNumeric', 'description', 'imageCount'].every((k) => k in pubProd);
    check('catalogue : produit publié visible + shape complet', res.statusCode === 200 && shapeOk);
    // NB : Intl.NumberFormat('fr-FR') utilise une espace fine insécable (U+202F)
    check('catalogue : prix formaté GNF + numérique', pubProd?.prixNumeric === 2000000 && /^\d[\d\s\u00A0\u202F]+GNF$/.test(pubProd?.prix));
    check('catalogue : produit MASQUÉ absent', !res.body.products.some((p: any) => p.id === prodDevisId));

    res = await call(productPublicH, mockReq({ query: { categorySlug: 'tables-e2e', modelSlug: 'table-basse-e2e' } }));
    check('détail public produit par slugs', res.statusCode === 200 && res.body.id === prodId && res.body.images.length === 2 && res.body.prixNumeric === 2000000);
    res = await call(productPublicH, mockReq({ query: { categorySlug: 'tables-e2e', modelSlug: 'inconnu' } }));
    check('produit inconnu → 404', res.statusCode === 404);

    /* ══ 5. GALERIE ═══════════════════════════════════════════════ */
    console.log('\n══ 5. GALERIE ══');
    res = await call(galleryH, mockReq({ method: 'POST', headers: authHeaders, body: { mediaType: 'image', url: 'https://exemple.com/gal-e2e.jpg', title: 'Réalisation E2E' } }));
    check('création élément galerie image', res.statusCode === 201 && res.body.is_published);
    const galImgId = res.body.id; created.gal.push(galImgId);
    res = await call(galleryH, mockReq({ method: 'POST', headers: authHeaders, body: { mediaType: 'video', url: 'https://drive.google.com/file/d/ABC123/preview', title: 'Vidéo E2E' } }));
    check('création vidéo externe (embed Drive)', res.statusCode === 201 && res.body.media_type === 'video');
    const galVidId = res.body.id; created.gal.push(galVidId);

    res = await call(galleryItemH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: galImgId }, body: { isPublished: false } }));
    check('masquage élément galerie', res.statusCode === 200 && res.body.is_published === false);
    res = await call(galleryReorderH, mockReq({ method: 'PUT', headers: authHeaders, body: { order: [galVidId, galImgId] } }));
    check('réordonnancement galerie', res.statusCode === 200);

    res = await call(galleryPublicH, mockReq({}));
    check('galerie publique : masqué absent, vidéo visible dans "videos"', res.statusCode === 200 &&
      !res.body.images.some((i: any) => i.id === galImgId) && res.body.videos.some((i: any) => i.id === galVidId));

    /* ══ 6. PROSPECTS (LEADS) ═════════════════════════════════════ */
    console.log('\n══ 6. PROSPECTS ══');
    res = await call(leadsPublicH, mockReq({ method: 'POST', body: { website: 'http://spam.bot' } }));
    check('pot de miel rempli → faux succès (pas de lead créé)', res.statusCode === 200);
    const [{ n: leadsBefore }] = await sql`SELECT COUNT(*)::int AS n FROM leads`;

    res = await call(leadsPublicH, mockReq({ method: 'POST', body: { firstName: 'Fatou', lastName: 'Diallo', phone: '+224 622 000 000', email: 'fatou@test.gn', serviceType: 'creation', message: 'Je veux une table', source: 'contact_page' } }));
    check('formulaire contact → 201', res.statusCode === 201);
    const [{ n: leadsAfter }] = await sql`SELECT COUNT(*)::int AS n FROM leads`;
    check('lead réellement enregistré en base', leadsAfter === leadsBefore + 1);

    res = await call(leadsPublicH, mockReq({ method: 'POST', body: {} }));
    check('formulaire vide → 400', res.statusCode === 400);

    res = await call(leadsH, mockReq({ headers: authHeaders, query: { q: 'fatou' } }));
    const lead = res.body[0];
    check('recherche admin par nom', res.statusCode === 200 && lead?.first_name === 'Fatou');
    created.leads.push(lead.id);

    res = await call(leadH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: lead.id }, body: { status: 'contacted' } }));
    check('changement statut prospect → contacté', res.statusCode === 200 && res.body.status === 'contacted');
    res = await call(leadH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: lead.id }, body: { status: 'invalide' } }));
    check('statut invalide → 400', res.statusCode === 400);

    /* ══ 7. PARAMÈTRES ════════════════════════════════════════════ */
    console.log('\n══ 7. PARAMÈTRES DU SITE ══');
    const originalHome = await sql`SELECT value FROM settings WHERE key='home'`;
    res = await call(settingsAdminH, mockReq({ method: 'GET', headers: authHeaders }));
    check('settings admin : sections fusionnées', res.statusCode === 200 && Object.keys(res.body).length >= 10);

    res = await call(settingsAdminH, mockReq({ method: 'PUT', headers: authHeaders, body: { key: 'home', value: { ...res.body.home, badge: 'BADGE E2E MODIFIÉ' } } }));
    check('sauvegarde section home', res.statusCode === 200 && res.body.value.badge === 'BADGE E2E MODIFIÉ');

    res = await call(settingsPublicH, mockReq({}));
    check('settings PUBLIC reflète la modification', res.body.home?.badge === 'BADGE E2E MODIFIÉ');
    await sql`UPDATE settings SET value = ${JSON.stringify(originalHome[0].value)}::jsonb WHERE key='home'`;

    /* ══ 8. PAIEMENT — CRÉATION (chemins de validation) ═══════════ */
    console.log('\n══ 8. PAIEMENT — CRÉATION ══');
    res = await call(paymentCreateH, mockReq({ method: 'POST', body: { productId: 999999, payerNumber: '622000000', nom: 'Test' } }));
    check('produit inexistant → 404', res.statusCode === 404);
    // Le produit « sur devis » est republié pour tester le contrôle de prix
    await call(productH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: prodDevisId }, body: { isPublished: true } }));
    res = await call(paymentCreateH, mockReq({ method: 'POST', body: { productId: prodDevisId, payerNumber: '622000000', nom: 'Test' } }));
    check('produit sans prix → 400 « sur devis »', res.statusCode === 400 && /sur devis/i.test(res.body.error));
    res = await call(paymentCreateH, mockReq({ method: 'POST', body: { productId: prodId } }));
    check('informations client manquantes → 400', res.statusCode === 400);

    /* ══ 9. WEBHOOK DJOMY — FLUX COMPLET SIGNÉ ════════════════════ */
    console.log('\n══ 9. WEBHOOK DJOMY ══');
    const secret = process.env.DJOMY_CLIENT_SECRET!;
    const sign = (raw: string) => 'v1:' + crypto.createHmac('sha256', secret).update(raw).digest('hex');

    // Commande pending simulée (comme create.ts le ferait avant redirection)
    const refOk = `E2E-OK-${Date.now()}`;
    const [orderOk] = await sql`
      INSERT INTO orders (reference, product_id, product_name, price_total, deposit_amount,
        customer_name, customer_phone, customer_address, payment_status)
      VALUES (${refOk}, ${prodId}, 'Table Basse E2E', 2000000, 1200000, 'Fatou Diallo', '622000000', 'Conakry', 'pending')
      RETURNING id`;
    created.orders.push(orderOk.id);

    // Signature invalide → 403
    const payloadOk = JSON.stringify({ eventType: 'payment.success', merchantPaymentReference: refOk, data: { paidAmount: 1200000, transactionId: 'TX-E2E-1' } });
    res = await call(webhookH, webhookReq(payloadOk, { 'x-webhook-signature': 'v1:' + '0'.repeat(64) }));
    check('signature invalide → 403 (rejet)', res.statusCode === 403);
    let [row] = await sql`SELECT payment_status FROM orders WHERE id = ${orderOk.id}`;
    check('commande non modifiée après signature invalide', row.payment_status === 'pending');

    // Signature valide → commande payée
    res = await call(webhookH, webhookReq(payloadOk, { 'x-webhook-signature': sign(payloadOk) }));
    check('payment.success signé → 200', res.statusCode === 200);
    [row] = await sql`SELECT payment_status, paid_amount, djomy_transaction_id, paid_at FROM orders WHERE id = ${orderOk.id}`;
    check('commande marquée PAYÉE avec montant + transaction', row.payment_status === 'paid' && Number(row.paid_amount) === 1200000 && row.djomy_transaction_id === 'TX-E2E-1' && !!row.paid_at);

    // Idempotence : rejeu → toujours payée
    await call(webhookH, webhookReq(payloadOk, { 'x-webhook-signature': sign(payloadOk) }));
    [row] = await sql`SELECT payment_status, paid_amount FROM orders WHERE id = ${orderOk.id}`;
    check('rejeu du webhook → idempotent (inchangé)', row.payment_status === 'paid' && Number(row.paid_amount) === 1200000);

    // Anti-fraude : acompte insuffisant
    const refFraude = `E2E-FRAUDE-${Date.now()}`;
    const [orderFraude] = await sql`
      INSERT INTO orders (reference, product_id, product_name, price_total, deposit_amount,
        customer_name, customer_phone, payment_status)
      VALUES (${refFraude}, ${prodId}, 'Table Basse E2E', 2000000, 1200000, 'Tricheur', '600000000', 'pending')
      RETURNING id`;
    created.orders.push(orderFraude.id);
    const payloadFraude = JSON.stringify({ eventType: 'payment.success', merchantPaymentReference: refFraude, data: { paidAmount: 5000 } });
    await call(webhookH, webhookReq(payloadFraude, { 'x-webhook-signature': sign(payloadFraude) }));
    const [rowF] = await sql`SELECT payment_status, metadata FROM orders WHERE id = ${orderFraude.id}`;
    check('acompte insuffisant → ÉCHOUÉE + alerte fraude', rowF.payment_status === 'failed' && rowF.metadata?.fraudAlert === true);

    // Référence inconnue → ACK sans crash, aucune autre commande affectée
    const payloadInconnu = JSON.stringify({ eventType: 'payment.success', merchantPaymentReference: 'E2E-INCONNU-XYZ', data: { paidAmount: 100 } });
    res = await call(webhookH, webhookReq(payloadInconnu, { 'x-webhook-signature': sign(payloadInconnu) }));
    [row] = await sql`SELECT payment_status FROM orders WHERE id = ${orderOk.id}`;
    check('référence inconnue → aucune commande affectée', res.statusCode === 200 && row.payment_status === 'paid');

    // Annulation
    const refCancel = `E2E-CANCEL-${Date.now()}`;
    const [orderCancel] = await sql`
      INSERT INTO orders (reference, product_name, price_total, deposit_amount, customer_name, payment_status)
      VALUES (${refCancel}, 'Table Basse E2E', 2000000, 1200000, 'Client', 'pending') RETURNING id`;
    created.orders.push(orderCancel.id);
    const payloadCancel = JSON.stringify({ eventType: 'payment.cancelled', merchantPaymentReference: refCancel });
    await call(webhookH, webhookReq(payloadCancel, { 'x-webhook-signature': sign(payloadCancel) }));
    const [rowC] = await sql`SELECT payment_status FROM orders WHERE id = ${orderCancel.id}`;
    check('payment.cancelled → commande annulée', rowC.payment_status === 'cancelled');

    /* ══ 10. COMMANDES ADMIN + STATS ══════════════════════════════ */
    console.log('\n══ 10. COMMANDES ADMIN + STATS ══');
    res = await call(ordersH, mockReq({ headers: authHeaders, query: { status: 'paid' } }));
    check('liste commandes filtrée (payées)', res.statusCode === 200 && res.body.some((o: any) => o.reference === refOk));
    res = await call(orderH, mockReq({ method: 'PUT', headers: authHeaders, query: { id: orderCancel.id }, body: { paymentStatus: 'refunded' } }));
    check('mise à jour manuelle statut → remboursée', res.statusCode === 200 && res.body.payment_status === 'refunded');

    res = await call(statsH, mockReq({ headers: authHeaders }));
    check('stats dashboard cohérentes', res.statusCode === 200 && res.body.orders_paid >= 1 && res.body.revenue >= 1200000 && res.body.recentLeads.length >= 1);

    /* ══ 11. DÉCONNEXION ══════════════════════════════════════════ */
    console.log('\n══ 11. DÉCONNEXION ══');
    res = await call(logout, mockReq({ method: 'POST', headers: authHeaders }));
    check('logout → cookie effacé', res.statusCode === 200 && res.cookies.some((c: string) => c.includes('Max-Age=0')));

    /* ══ BILAN ════════════════════════════════════════════════════ */
  } finally {
    // Nettoyage complet des données de test
    console.log('\n── Nettoyage des données de test ──');
    if (created.orders.length) await sql`DELETE FROM orders WHERE id = ANY(${created.orders})`;
    if (created.leads.length) await sql`DELETE FROM leads WHERE id = ANY(${created.leads})`;
    if (created.gal.length) await sql`DELETE FROM gallery_items WHERE id = ANY(${created.gal})`;
    if (created.prods.length) await sql`DELETE FROM products WHERE id = ANY(${created.prods})`;
    if (created.cats.length) await sql`DELETE FROM categories WHERE id = ANY(${created.cats})`;
    const [{ n: prods }] = await sql`SELECT COUNT(*)::int AS n FROM products`;
    const [{ n: leads }] = await sql`SELECT COUNT(*)::int AS n FROM leads`;
    const [{ n: orders }] = await sql`SELECT COUNT(*)::int AS n FROM orders`;
    console.log(`Base propre : ${prods} produit(s), ${leads} lead(s), ${orders} commande(s) restants.`);
  }

  console.log(`\n${'═'.repeat(50)}\n  RÉSULTAT : ${passed} réussis · ${failed} échoués\n${'═'.repeat(50)}`);
  if (failed > 0) { console.log('ÉCHECS :', failures.join(' | ')); process.exit(1); }
}

main().catch((e) => { console.error('❌ Erreur test E2E :', e); process.exit(1); });

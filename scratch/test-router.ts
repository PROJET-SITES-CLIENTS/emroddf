// ══════════════════════════════════════════════════════════════════
// TEST DU ROUTEUR UNIQUE api/[[...path]].ts
// Vérifie le dispatch réel (URL + méthode + corps + auth + HMAC webhook)
// Usage : npx tsx scratch/test-router.ts
// ══════════════════════════════════════════════════════════════════
import 'dotenv/config';
import crypto from 'crypto';

let passed = 0, failed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, extra = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.log(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

/** Fabrique une vraie requête façon Vercel (flux consommable une fois) */
function makeReq({ method = 'GET', url, headers = {}, body }: {
  method?: string; url: string; headers?: Record<string, string>; body?: any;
}) {
  const hasBody = body !== undefined;
  const payload = hasBody ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) : null;
  const req: any = {
    method, url,
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
  };
  if (payload) {
    req[Symbol.asyncIterator] = async function* () { yield payload; };
  } else {
    req[Symbol.asyncIterator] = async function* () { /* vide */ };
  }
  return req;
}

function makeRes() {
  const r: any = {
    statusCode: 0, headersSent: false, body: undefined, cookies: [] as string[], headers: {} as any,
    status(c: number) { r.statusCode = c; return r; },
    json(b: any) { r.body = b; r.headersSent = true; return r; },
    end(b?: any) { if (b !== undefined) r.body = b; r.headersSent = true; return r; },
    setHeader(k: string, v: any) {
      r.headers[k.toLowerCase()] = v;
      if (k.toLowerCase() === 'set-cookie') r.cookies.push(v);
      return r;
    },
  };
  return r;
}

async function main() {
  const router = (await import('../api/[[...path]]')).default;
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL!) as any;
  const cleanup: string[] = [];

  function fire(opts: any) {
    const r = makeRes();
    const req = makeReq(opts);
    return router(req, r).then(() => r);
  }

  try {
    console.log('\n══ ROUTEUR — dispatch général ══');

    // 1. Route publique simple
    let res = await fire({ url: '/api/public/settings' });
    check('GET /api/public/settings → 200 + home', res.statusCode === 200 && 'home' in res.body);

    // 2. Route avec query string
    res = await fire({ url: '/api/public/catalogue?x=1' });
    check('GET /api/public/catalogue → 200 + structure', res.statusCode === 200 && 'products' in res.body && 'categories' in res.body);

    // 3. Route paramétrée (2 niveaux) + 404
    res = await fire({ url: '/api/public/product/divers/inconnu-xyz' });
    check('produit inconnu → 404', res.statusCode === 404);
    res = await fire({ url: '/api/toto' });
    const notFoundBody = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
    check('route inconnue → 404 « Route inconnue »', res.statusCode === 404 && /Route inconnue/.test(notFoundBody?.error || ''));

    // 4. Auth à travers le routeur
    res = await fire({ method: 'POST', url: '/api/admin/login', body: { email: 'x@y.z', password: 'mauvais' } });
    check('POST login mauvais identifiants → 401', res.statusCode === 401);
    res = await fire({ method: 'POST', url: '/api/admin/login', body: { email: process.env.ADMIN_EMAIL!.trim(), password: process.env.ADMIN_PASSWORD!.trim() } });
    check('POST login bons identifiants → 200 + cookie', res.statusCode === 200 && res.cookies.some((c: string) => c.startsWith('emrod_admin=')));
    const token = res.cookies.find((c: string) => c.startsWith('emrod_admin='))?.split(';')[0];
    const auth = { cookie: token };

    res = await fire({ url: '/api/admin/categories' });
    check('GET admin SANS cookie → 401 (garde active via routeur)', res.statusCode === 401);
    res = await fire({ url: '/api/admin/categories', headers: auth });
    check('GET admin AVEC cookie → 200 (tableau)', res.statusCode === 200 && Array.isArray(res.body));

    // 5. Paramètre de route transmis (req.query)
    res = await fire({ method: 'POST', url: '/api/public/leads', body: { firstName: 'Router', lastName: 'Test', phone: '+224 600 111 222', source: 'test_routeur' } });
    check('POST /api/public/leads (corps JSON parsé) → 201', res.statusCode === 201);
    const [lead] = await sql`SELECT id FROM leads WHERE source = 'test_routeur' LIMIT 1`;
    if (lead) cleanup.push('leads');

    // 6. Corps brut préservé pour le HMAC du webhook (chemin critique)
    console.log('\n══ ROUTEUR — webhook HMAC (corps brut) ══');
    const secret = process.env.DJOMY_CLIENT_SECRET!;
    const ref = `ROUTER-${Date.now()}`;
    const [order] = await sql`
      INSERT INTO orders (reference, product_name, price_total, deposit_amount, customer_name, payment_status)
      VALUES (${ref}, 'Test Routeur', 1000000, 600000, 'Router', 'pending') RETURNING id`;
    cleanup.push('orders');
    const rawBody = JSON.stringify({ eventType: 'payment.success', merchantPaymentReference: ref, data: { paidAmount: 600000, transactionId: 'TX-ROUTER-1' } });
    const sig = 'v1:' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    res = await fire({ method: 'POST', url: '/api/payment/webhook', headers: { 'x-webhook-signature': 'v1:' + '0'.repeat(64) }, body: rawBody });
    check('webhook signature invalide → 403', res.statusCode === 403);
    res = await fire({ method: 'POST', url: '/api/payment/webhook', headers: { 'x-webhook-signature': sig }, body: rawBody });
    check('webhook signature valide → 200', res.statusCode === 200);
    const [row] = await sql`SELECT payment_status, paid_amount FROM orders WHERE id = ${order.id}`;
    check('commande PAYÉE via le routeur (HMAC sur corps brut intact)', row.payment_status === 'paid' && Number(row.paid_amount) === 600000);

    // 7. Préflight CORS du paiement
    res = await fire({ method: 'OPTIONS', url: '/api/payment/create' });
    check('OPTIONS /api/payment/create → 200 (CORS)', res.statusCode === 200);
  } finally {
    console.log('\n── Nettoyage ──');
    if (cleanup.includes('leads')) await sql`DELETE FROM leads WHERE source = 'test_routeur'`;
    if (cleanup.includes('orders')) await sql`DELETE FROM orders WHERE reference LIKE 'ROUTER-%'`;
    console.log('Base nettoyée.');
  }

  console.log(`\n  RÉSULTAT ROUTEUR : ${passed} réussis · ${failed} échoués`);
  if (failed > 0) { console.log('ÉCHECS :', failures.join(' | ')); process.exit(1); }
}

main().catch((e) => { console.error('❌', e); process.exit(1); });

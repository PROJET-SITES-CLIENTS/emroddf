// Test du module d'authentification admin (sans base de données)
process.env.ADMIN_SESSION_SECRET = 'secret-de-test-1234567890';
process.env.ADMIN_EMAIL = 'Admin@EMRODdf.com ';
process.env.ADMIN_PASSWORD = 'MotDePasse123';

async function main() {
  const mod = await import('../api/router');
  const { createSessionToken, verifySessionToken, checkCredentials, requireAdmin } = mod;

  // 1. Roundtrip token valide
  const token = createSessionToken();
  console.log('Token généré :', token.slice(0, 30) + '...');
  console.log('verify(token valide)      =', verifySessionToken(token), '(attendu: true)');

  // 2. Token falsifié (signature modifiée)
  const parts = token.split('.');
  const falsified = `${parts[0]}.${'a'.repeat(64)}`;
  console.log('verify(token falsifié)    =', verifySessionToken(falsified), '(attendu: false)');

  // 3. Payload trafiqué (exp prolongée) mais signature d'origine
  const tampered = Buffer.from(JSON.stringify({ exp: Date.now() + 9999999999 })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.' + parts[1];
  console.log('verify(payload trafiqué)  =', verifySessionToken(tampered), '(attendu: false)');

  // 4. Token expiré
  // simuler expiration : créer un token avec un secret different ne marche pas ; on forge un token expiré signé correctement
  const crypto = await import('crypto');
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() - 1000 })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET!).update(payload).digest('hex');
  console.log('verify(token expiré)      =', verifySessionToken(`${payload}.${sig}`), '(attendu: false)');

  // 5. Identifiants (avec trim + casse email insensible)
  console.log('checkCredentials("admin@emroddf.com", "MotDePasse123") =', checkCredentials('admin@emroddf.com', 'MotDePasse123'), '(attendu: true)');
  console.log('checkCredentials("admin@emroddf.com", "mauvais")       =', checkCredentials('admin@emroddf.com', 'mauvais'), '(attendu: false)');

  // 6. requireAdmin : mock req/res
  const res401 = { statusCode: 0, body: null as any, status(c: number) { this.statusCode = c; return this; }, json(j: any) { this.body = j; return this; } };
  const res200 = { statusCode: 0, body: null as any, status(c: number) { this.statusCode = c; return this; }, json(j: any) { this.body = j; return this; } };
  console.log('requireAdmin sans cookie  =', requireAdmin({ headers: {} }, res401), '| status:', res401.statusCode, '(attendu: false | 401)');
  console.log('requireAdmin bon cookie   =', requireAdmin({ headers: { cookie: `emrod_admin=${token}` } }, res200), '| status:', res200.statusCode, '(attendu: true | 0)');

  console.log('\n✅ Tests authentification terminés');
}
main().catch((e) => { console.error('❌', e); process.exit(1); });

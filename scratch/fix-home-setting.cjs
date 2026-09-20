require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
(async () => {
  const [row] = await sql`SELECT value FROM settings WHERE key='home'`;
  const home = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
  home.realisations = home.realisations.map((r: string) => r.replace('WA0088', 'WA0086'));
  await sql`UPDATE settings SET value = ${JSON.stringify(home)}::jsonb WHERE key='home'`;
  console.log('settings.home.realisations corrigé (WA0088 → WA0086)');
  await sql.end();
})().catch(e => { console.error(e.message); process.exit(1); });

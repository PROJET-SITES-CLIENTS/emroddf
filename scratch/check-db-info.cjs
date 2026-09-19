require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  const settings = await sql`SELECT COUNT(*)::int AS n FROM settings`;
  console.log('Base       : neondb');
  console.log('Region     : us-east-2 (AWS, USA Est)');
  console.log('Endpoint   : ep-dark-snow-aygi9agc-pooler');
  console.log('Tables     :', tables.map(t => t.tablename).join(', '));
  console.log('Parametres : ' + settings[0].n + ' sections');
})().catch(e => { console.error(e.message); process.exit(1); });

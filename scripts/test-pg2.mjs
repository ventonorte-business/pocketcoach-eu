import pg from 'pg';
const {Client} = pg;

// Tentar AWS RDS endpoint direto (resolveria AWS)
const hosts = [
  'db.truyvkifnmmavkxkjmto.supabase.co',
  'aws-0-eu-west-1.pooler.supabase.com',  // pooler genérico
  'truyvkifnmmavkxkjmto.pooler.supabase.com',
];

for (const host of hosts) {
  for (const port of [5432, 6543]) {
    const c = new Client({host, port, database:'postgres', user:`postgres.${'truyvkifnmmavkxkjmto'}`, password:'PocketCoach2026Secure', ssl:{rejectUnauthorized:false}, connectionTimeoutMillis:5000});
    try {
      await c.connect();
      console.log(`OK ${host}:${port}`);
      const r = await c.query('SELECT version()');
      console.log(r.rows[0].version);
      await c.end();
      process.exit(0);
    } catch(e) {
      console.log(`FAIL ${host}:${port} -> ${e.code || e.message}`);
    }
  }
}

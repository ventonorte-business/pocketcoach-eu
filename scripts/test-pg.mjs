import pg from 'pg';
const {Client} = pg;
const c = new Client({host:'db.truyvkifnmmavkxkjmto.supabase.co', port:5432, database:'postgres', user:'postgres', password:'PocketCoach2026Secure', ssl:{rejectUnauthorized:false}, connectionTimeoutMillis:8000});
try {
  await c.connect();
  console.log('OK connected');
  const r = await c.query('SELECT version()');
  console.log(r.rows[0]);
} catch(e) {
  console.log('ERR:', e.message, '| code:', e.code);
} finally {
  await c.end();
}

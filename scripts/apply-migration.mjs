// Apply migration to remote Supabase via Supavisor pooler
// Uses the service_role connection pattern (postgres.PROJECT_REF as user)

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'truyvkifnmmavkxkjmto';
const DB_PASSWORD = 'PocketCoach2026Secure';
const POOLER_HOST = 'aws-0-eu-west-1.pooler.supabase.com';

const sql = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20260722000000_initial_schema.sql'),
  'utf8'
);

const client = new Client({
  host: POOLER_HOST,
  port: 5432,
  database: 'postgres',
  user: `postgres.${PROJECT_REF}`,
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log('⏳ Connecting to Supabase pooler...');
  await client.connect();
  console.log('✅ Connected');

  console.log('⏳ Applying migration...');
  await client.query(sql);
  console.log('✅ Migration applied successfully');

  // Verify tables were created
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('\n📋 Tables created:');
  for (const row of result.rows) {
    console.log(`   - ${row.table_name}`);
  }
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
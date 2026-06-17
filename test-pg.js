const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.vjstjaoltqbtqpehheph:MCgFoJaEjn0MZuvO@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await client.connect();
    const res = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
    console.log('Tables:', res.rows);
    await client.end();
  } catch (err) {
    console.error('Connection error', err.stack);
  }
}

test();

const { getPool } = require('../lib/db');

async function up() {
  const pool = await getPool();
  
  // Tambah kolom event_query
  await pool.query(`
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS event_query VARCHAR(50) DEFAULT 'public';
  `);
}

async function down() {
  const pool = await getPool();
  
  // Hapus kolom event_query
  await pool.query(`
    ALTER TABLE tickets
    DROP COLUMN IF EXISTS event_query;
  `);
}

module.exports = {
  up,
  down
}; 
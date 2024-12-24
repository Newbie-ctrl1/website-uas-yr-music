const { Pool } = require('pg');
const { getPool } = require('../lib/db');

async function up() {
  const pool = await getPool();
  
  // Buat tabel images
  await pool.query(`
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      data BYTEA NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function down() {
  const pool = await getPool();
  
  // Hapus tabel images
  await pool.query(`
    DROP TABLE IF EXISTS images;
  `);
}

module.exports = {
  up,
  down
}; 
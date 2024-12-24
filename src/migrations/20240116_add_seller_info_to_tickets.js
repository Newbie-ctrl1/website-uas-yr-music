const { getPool } = require('../lib/db');

async function up() {
  const pool = await getPool();
  try {
    await pool.query(`
      -- Tambah kolom seller_name dan seller_email ke tabel tickets
      ALTER TABLE tickets 
      ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS seller_email VARCHAR(255);

      -- Update data yang sudah ada dengan mengambil dari tabel users
      UPDATE tickets t 
      SET 
        seller_name = u.display_name,
        seller_email = u.email
      FROM users u 
      WHERE t.seller_id = u.id 
      AND (t.seller_name IS NULL OR t.seller_email IS NULL);
    `);
    
    console.log('Successfully added seller info columns to tickets table');
  } catch (error) {
    console.error('Error adding seller info columns:', error);
    throw error;
  }
}

async function down() {
  const pool = await getPool();
  try {
    await pool.query(`
      ALTER TABLE tickets 
      DROP COLUMN IF EXISTS seller_name,
      DROP COLUMN IF EXISTS seller_email;
    `);
    console.log('Successfully removed seller info columns from tickets table');
  } catch (error) {
    console.error('Error removing seller info columns:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
}; 
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '@Postgresql001',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'yr_music_db',
  port: process.env.POSTGRES_PORT || 5432,
});

async function addTicketCodesColumn() {
  try {
    // Drop kolom jika sudah ada untuk menghindari konflik
    await pool.query(`
      ALTER TABLE notifications 
      DROP COLUMN IF EXISTS ticket_codes;
    `);
    console.log('Successfully dropped existing ticket_codes column if it existed');

    // Tambah kolom baru
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN ticket_codes TEXT[];
    `);
    console.log('Successfully added ticket_codes column to notifications table');

    // Verifikasi kolom telah ditambahkan
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'ticket_codes';
    `);
    
    if (result.rows.length > 0) {
      console.log('Verified ticket_codes column exists:', result.rows[0]);
    } else {
      throw new Error('Failed to verify ticket_codes column existence');
    }
  } catch (error) {
    console.error('Error managing ticket_codes column:', error);
  } finally {
    await pool.end();
  }
}

addTicketCodesColumn(); 
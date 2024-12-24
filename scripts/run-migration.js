const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Baca konfigurasi database dari .env
require('dotenv').config({
  path: path.join(__dirname, '../.env.local')
});

// Log environment variables untuk debugging
console.log('Database Config:', {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT
});

// Buat koneksi pool langsung dengan konfigurasi
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT,
  ssl: false
});

async function runMigration() {
  try {
    console.log('Mencoba koneksi ke database...');
    const client = await pool.connect();
    console.log('Berhasil terkoneksi ke database');

    // Baca file SQL
    const sqlPath = path.join(__dirname, '../migrations/create_ticket_codes_table.sql');
    console.log('Membaca file migration:', sqlPath);
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');

    console.log('Menjalankan migration...');
    // Jalankan query
    await client.query(sqlContent);
    
    console.log('Migration berhasil dijalankan!');
    client.release();
  } catch (error) {
    console.error('Error menjalankan migration:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
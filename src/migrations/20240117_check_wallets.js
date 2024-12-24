import { query } from '@/lib/db';

export async function up() {
  try {
    // Drop tabel yang ada jika ada
    await query(`DROP TABLE IF EXISTS transactions CASCADE`);
    await query(`DROP TABLE IF EXISTS wallets CASCADE`);

    // Buat tabel wallets
    await query(`
      CREATE TABLE wallets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        wallet_type VARCHAR(50) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, wallet_type)
      )
    `);

    // Buat tabel transactions
    await query(`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        wallet_type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id, wallet_type) REFERENCES wallets(user_id, wallet_type)
      )
    `);

    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down() {
  try {
    await query(`DROP TABLE IF EXISTS transactions CASCADE`);
    await query(`DROP TABLE IF EXISTS wallets CASCADE`);
    console.log('Rollback successful');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
}; 
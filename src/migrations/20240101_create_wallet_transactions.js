const { getPool } = require('../lib/db');

async function up() {
  const pool = await getPool();
  
  // Membuat tabel wallet_transactions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id SERIAL PRIMARY KEY,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'completed',
      wallet_type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Membuat indeks
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
  `);
}

async function down() {
  const pool = await getPool();
  
  // Menghapus indeks
  await pool.query(`
    DROP INDEX IF EXISTS idx_wallet_transactions_user_id;
    DROP INDEX IF EXISTS idx_wallet_transactions_wallet_id;
    DROP INDEX IF EXISTS idx_wallet_transactions_created_at;
  `);

  // Menghapus tabel
  await pool.query(`
    DROP TABLE IF EXISTS wallet_transactions CASCADE
  `);
}

module.exports = {
  up,
  down
}; 
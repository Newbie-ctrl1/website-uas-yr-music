const { query } = require('@/lib/db');

async function up() {
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

    // Ambil semua user
    const users = await query(`SELECT id FROM users`);

    // Inisialisasi wallet untuk setiap user
    for (const user of users.rows) {
      const walletTypes = ['DindaPay', 'RendiPay', 'ErwinPay'];
      
      for (const type of walletTypes) {
        await query(
          `INSERT INTO wallets (user_id, wallet_type, balance)
           VALUES ($1, $2, 0)
           ON CONFLICT (user_id, wallet_type) DO NOTHING`,
          [user.id, type]
        );
      }
    }

    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down() {
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
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addDefaultBalance() {
  const client = await pool.connect();
  try {
    // Mulai transaksi
    await client.query('BEGIN');

    // Dapatkan semua user
    const { rows: users } = await client.query('SELECT id FROM users');

    // Wallet types
    const walletTypes = ['DindaPay', 'RendiPay', 'ErwinPay'];

    // Untuk setiap user, buat wallet dengan saldo awal 1 rupiah
    for (const user of users) {
      for (const walletType of walletTypes) {
        // Cek apakah wallet sudah ada
        const { rows } = await client.query(
          'SELECT * FROM wallets WHERE user_id = $1 AND wallet_type = $2',
          [user.id, walletType]
        );

        if (rows.length === 0) {
          // Jika wallet belum ada, buat baru dengan saldo 1 rupiah
          await client.query(
            'INSERT INTO wallets (user_id, wallet_type, balance) VALUES ($1, $2, $3)',
            [user.id, walletType, 1]
          );
        } else {
          // Jika wallet sudah ada, update saldo menjadi 1 rupiah
          await client.query(
            'UPDATE wallets SET balance = $1 WHERE user_id = $2 AND wallet_type = $3',
            [1, user.id, walletType]
          );
        }
      }
    }

    // Commit transaksi
    await client.query('COMMIT');
    console.log('Successfully added default balance to all users');
  } catch (error) {
    // Rollback jika terjadi error
    await client.query('ROLLBACK');
    console.error('Error adding default balance:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Jalankan migrasi
addDefaultBalance().catch(console.error); 
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const DEFAULT_WALLETS = ['RendiPay', 'ErwinPay', 'DindaPay'];

export async function POST(request) {
  const pool = await getPool();
  
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    await pool.query('BEGIN');

    // Hapus dompet yang ada
    await pool.query(
      'DELETE FROM wallets WHERE user_id = $1',
      [userId]
    );

    // Inisialisasi ulang dompet
    for (const walletType of DEFAULT_WALLETS) {
      await pool.query(
        `INSERT INTO wallets (user_id, wallet_type, balance)
         VALUES ($1, $2, 0)`,
        [userId, walletType]
      );
    }

    await pool.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Dompet berhasil direset'
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error resetting wallets:', error);
    return NextResponse.json(
      { error: 'Gagal mereset dompet' },
      { status: 500 }
    );
  }
} 
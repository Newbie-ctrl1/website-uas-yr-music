import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/wallets/:userId
export async function GET(request) {
  try {
    // Ekstrak userId dari URL dengan benar
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah user sudah memiliki wallet
    const result = await query(
      `SELECT * FROM wallets WHERE user_id = $1 ORDER BY wallet_type`,
      [userId]
    );

    // Jika belum ada wallet, inisialisasi wallet default
    if (result.rows.length === 0) {
      const defaultWallets = [
        { wallet_type: 'DindaPay', balance: 0 },
        { wallet_type: 'RendiPay', balance: 0 },
        { wallet_type: 'ErwinPay', balance: 0 }
      ];

      try {
        // Buat wallet default untuk user dalam satu transaksi
        await query('BEGIN');
        
        for (const wallet of defaultWallets) {
          await query(
            `INSERT INTO wallets (user_id, wallet_type, balance)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, wallet_type) DO NOTHING`,
            [userId, wallet.wallet_type, wallet.balance]
          );
        }

        await query('COMMIT');

        // Ambil wallet yang baru dibuat
        const newResult = await query(
          `SELECT * FROM wallets WHERE user_id = $1 ORDER BY wallet_type`,
          [userId]
        );

        return NextResponse.json(newResult.rows);
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

// POST /api/wallets
export async function POST(request) {
  try {
    const { userId, walletType } = await request.json();

    // Cek apakah wallet sudah ada
    const existingWallet = await query(
      `SELECT * FROM wallets WHERE user_id = $1 AND wallet_type = $2`,
      [userId, walletType]
    );

    if (existingWallet.rows.length > 0) {
      return NextResponse.json(
        { error: 'Wallet already exists' },
        { status: 400 }
      );
    }

    // Buat wallet baru
    const result = await query(
      `INSERT INTO wallets (user_id, wallet_type, balance)
       VALUES ($1, $2, 0)
       RETURNING *`,
      [userId, walletType]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
}
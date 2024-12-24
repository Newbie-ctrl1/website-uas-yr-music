import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah user sudah memiliki wallet
    const existingWallets = await query(
      `SELECT * FROM wallets WHERE user_id = $1`,
      [userId]
    );

    // Jika belum ada wallet, buat wallet baru
    if (existingWallets.rows.length === 0) {
      const walletTypes = ['DindaPay', 'RendiPay', 'ErwinPay'];
      
      for (const type of walletTypes) {
        await query(
          `INSERT INTO wallets (user_id, wallet_type, balance)
           VALUES ($1, $2, 0)
           ON CONFLICT (user_id, wallet_type) DO NOTHING`,
          [userId, type]
        );
      }
    }

    // Ambil wallet yang sudah dibuat
    const wallets = await query(
      `SELECT * FROM wallets WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json(wallets.rows);
  } catch (error) {
    console.error('Error initializing wallets:', error);
    return NextResponse.json(
      { error: 'Failed to initialize wallets' },
      { status: 500 }
    );
  }
} 
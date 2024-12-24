import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId, walletType, amount } = await request.json();

    // Validasi input
    if (!userId || !walletType || !amount || amount < 10000) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Cek apakah wallet ada
    const wallet = await query(
      `SELECT * FROM wallets WHERE user_id = $1 AND wallet_type = $2`,
      [userId, walletType]
    );

    if (wallet.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Update saldo wallet
    const result = await query(
      `UPDATE wallets 
       SET balance = balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND wallet_type = $3
       RETURNING *`,
      [amount, userId, walletType]
    );

    // Catat transaksi
    await query(
      `INSERT INTO transactions 
       (user_id, wallet_type, amount, type, description)
       VALUES ($1, $2, $3, 'topup', 'Top up saldo')`,
      [userId, walletType, amount]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error processing top up:', error);
    return NextResponse.json(
      { error: 'Failed to process top up' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/transactions/:userId
export async function GET(request) {
  try {
    const userId = request.url.split('/').pop();
    
    // Ambil semua transaksi untuk user
    const result = await query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request) {
  try {
    const { userId, walletType, amount, type, description } = await request.json();

    // Validasi input
    if (!userId || !walletType || !amount || !type) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Catat transaksi
    const result = await query(
      `INSERT INTO transactions 
       (user_id, wallet_type, amount, type, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, walletType, amount, type, description]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 
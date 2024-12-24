import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Cek apakah tabel wallets ada
    const checkWallets = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallets'
      )
    `);

    // Cek apakah tabel transactions ada
    const checkTransactions = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      )
    `);

    // Ambil jumlah wallet yang ada
    const walletsCount = await query(`
      SELECT COUNT(*) as count FROM wallets
    `);

    // Ambil jumlah transaksi yang ada
    const transactionsCount = await query(`
      SELECT COUNT(*) as count FROM transactions
    `);

    return NextResponse.json({
      wallets_table_exists: checkWallets.rows[0].exists,
      transactions_table_exists: checkTransactions.rows[0].exists,
      wallets_count: walletsCount.rows[0].count,
      transactions_count: transactionsCount.rows[0].count
    });
  } catch (error) {
    console.error('Error checking wallet status:', error);
    return NextResponse.json(
      { error: 'Failed to check wallet status' },
      { status: 500 }
    );
  }
} 
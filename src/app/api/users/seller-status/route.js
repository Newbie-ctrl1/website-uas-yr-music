import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    
    // Cek apakah kolom is_seller ada
    const checkColumn = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_seller'
      );
    `);

    // Jika kolom belum ada, tambahkan kolom
    if (!checkColumn.rows[0].exists) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_seller BOOLEAN DEFAULT TRUE;
        
        UPDATE users SET is_seller = TRUE;
      `);
    }

    // Ambil status seller
    const result = await pool.query(
      'SELECT COALESCE(is_seller, TRUE) as is_seller FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { isSeller: true }
      );
    }

    return NextResponse.json({
      isSeller: result.rows[0].is_seller
    });

  } catch (error) {
    console.error('Error checking seller status:', error);
    return NextResponse.json(
      { error: 'Gagal memeriksa status seller', isSeller: true },
      { status: 500 }
    );
  }
} 
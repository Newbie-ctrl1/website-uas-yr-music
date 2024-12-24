import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/users - Mendapatkan semua user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const pool = await getPool();
    
    if (id) {
      // Jika ada ID, ambil user spesifik
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    }

    // Jika tidak ada ID, ambil semua user
    const result = await pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan data pengguna' },
      { status: 500 }
    );
  }
}

// POST /api/users - Membuat user baru
export async function POST(request) {
  const pool = await getPool();
  
  try {
    const { id, email, displayName, photoURL } = await request.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: 'ID dan email diperlukan' },
        { status: 400 }
      );
    }

    // Cek apakah user sudah ada
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length > 0) {
      // Update user yang sudah ada
      const result = await pool.query(
        `UPDATE users 
         SET email = $1, 
             display_name = $2, 
             photo_url = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [email, displayName || null, photoURL || null, id]
      );
      
      return NextResponse.json(result.rows[0]);
    }

    // Buat user baru
    const result = await pool.query(
      `INSERT INTO users (
        id, 
        email, 
        display_name, 
        photo_url,
        is_seller
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [id, email, displayName || null, photoURL || null, false]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan data pengguna' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, displayName, photoURL } = data;

    const result = await query(
      `UPDATE users SET
         display_name = $1,
         photo_url = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [displayName, photoURL, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 
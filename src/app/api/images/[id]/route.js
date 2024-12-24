import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const pool = await getPool();
    
    const result = await pool.query(
      'SELECT data, mime_type FROM images WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const image = result.rows[0];
    
    // Buat response dengan tipe konten yang sesuai
    return new NextResponse(image.data, {
      headers: {
        'Content-Type': image.mime_type,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 }
    );
  }
} 
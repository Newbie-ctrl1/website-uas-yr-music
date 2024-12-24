import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Ambil semua tiket yang dibuat oleh user
    const result = await query(
      `SELECT 
        t.*,
        u.display_name as seller_name,
        u.photo_url as seller_photo
       FROM tickets t
       JOIN users u ON u.id = t.seller_id
       WHERE t.seller_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      tickets: result.rows
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
} 
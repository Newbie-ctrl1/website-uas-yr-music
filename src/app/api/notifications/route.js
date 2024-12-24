import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/notifications?userId={userId}
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/{id}
export async function PATCH(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// POST /api/notifications
export async function POST(request) {
  try {
    const { userId, title, message, type } = await request.json();

    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [userId, title, message, type]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
} 
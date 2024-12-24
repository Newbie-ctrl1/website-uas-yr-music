import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET() {
  try {
    // Test simple query
    const result = await query('SELECT NOW()', []);
    
    // Test users table
    const usersResult = await query('SELECT COUNT(*) FROM users', []);
    
    // Test tickets table
    const ticketsResult = await query('SELECT COUNT(*) FROM tickets', []);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      serverTime: result.rows[0].now,
      counts: {
        users: parseInt(usersResult.rows[0].count),
        tickets: parseInt(ticketsResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    }, { status: 500 });
  }
} 
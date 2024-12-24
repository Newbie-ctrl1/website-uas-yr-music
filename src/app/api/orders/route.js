import { getOrderHistory } from '@/models/notification';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isSeller = searchParams.get('isSeller') === 'true';

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const orders = await getOrderHistory(userId, isSeller);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
} 
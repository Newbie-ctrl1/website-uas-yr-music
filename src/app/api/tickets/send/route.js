import { sendTicket } from '@/models/notification';
import { auth } from '@/lib/firebase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    console.log('Attempting to send ticket:', { orderId, sellerId: user.uid });
    const result = await sendTicket(orderId, user.uid);
    console.log('Ticket sent successfully:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending ticket:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
} 
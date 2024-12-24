'use server';

import { NextResponse } from 'next/server';
import { updateTicket, deleteTicket } from '@/models/ticket';
import { auth } from '@/lib/firebase-admin';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Validasi token dan dapatkan user ID
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const sellerId = decodedToken.uid;

    if (!sellerId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Update tiket dengan seller ID
    const updatedTicket = await updateTicket(id, data, sellerId);
    
    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update ticket' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Validasi token dan dapatkan user ID
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const sellerId = decodedToken.uid;

    if (!sellerId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Hapus tiket dengan validasi seller ID
    await deleteTicket(id, sellerId);
    
    return NextResponse.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete ticket' },
      { status: error.status || 500 }
    );
  }
} 
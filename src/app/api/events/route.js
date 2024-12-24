import { NextResponse } from 'next/server';
import { getTickets } from '@/models/ticket';

export async function GET() {
  try {
    console.log('Fetching events...');
    const tickets = await getTickets();
    console.log('Fetched events:', tickets);

    // Filter untuk event yang akan datang
    const upcomingEvents = tickets.filter(ticket => {
      const eventDate = new Date(ticket.event_date);
      return eventDate > new Date();
    });

    // Urutkan berdasarkan tanggal terdekat
    upcomingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    
    console.log('Returning events:', upcomingEvents);
    return NextResponse.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Gagal memuat event. Silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
} 
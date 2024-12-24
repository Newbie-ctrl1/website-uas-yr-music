import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let query = searchParams.get('q') || '';

  if (query.length < 2) {
    return NextResponse.json({ artists: [], recommended: [] });
  }

  try {
    // Cari artis yang cocok dengan query
    const searchResponse = await fetch(
      `https://rest.bandsintown.com/artists/${encodeURIComponent(query)}?app_id=${process.env.NEXT_PUBLIC_BANDSINTOWN_APP_ID}`
    );
    const artistData = await searchResponse.json();

    // Cari artis yang direkomendasikan (contoh: menggunakan nama yang mirip)
    const recommendedResponse = await fetch(
      `https://rest.bandsintown.com/artists/${encodeURIComponent(query)}/similar_artists?app_id=${process.env.NEXT_PUBLIC_BANDSINTOWN_APP_ID}`
    );
    const recommendedData = await recommendedResponse.json();

    // Ambil event untuk artis yang ditemukan
    let events = [];
    if (artistData.id) {
      const eventsResponse = await fetch(
        `https://rest.bandsintown.com/artists/${encodeURIComponent(query)}/events?app_id=${process.env.NEXT_PUBLIC_BANDSINTOWN_APP_ID}`
      );
      events = await eventsResponse.json();
    }

    return NextResponse.json({
      artist: artistData.error ? null : artistData,
      recommended: Array.isArray(recommendedData) ? recommendedData : [],
      events: Array.isArray(events) ? events : []
    });
  } catch (error) {
    console.error('Artist Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search artists. Please try again.' },
      { status: 500 }
    );
  }
} 
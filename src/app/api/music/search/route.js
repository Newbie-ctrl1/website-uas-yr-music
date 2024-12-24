import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const headersList = headers();
  const referer = headersList.get('referer') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  const fetchOptions = {
    headers: {
      'Referer': referer,
      'Origin': new URL(referer).origin
    }
  };

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `maxResults=20&` +
      `type=video&` +
      `videoCategoryId=10&` + // Music category
      `q=${encodeURIComponent(query)}&` +
      `key=${API_KEY}`,
      fetchOptions
    );

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error('YouTube API Error:', data.error);
      return NextResponse.json(
        { error: data.error.message || 'Failed to fetch from YouTube API' },
        { status: data.error.code || 500 }
      );
    }

    // Check if items exist
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Get video details for duration
    const videoIds = data.items.map(item => item.id.videoId).join(',');
    
    if (!videoIds) {
      return NextResponse.json({ items: data.items });
    }

    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics&` +
      `id=${videoIds}&` +
      `key=${API_KEY}`,
      fetchOptions
    );
    
    const detailsData = await detailsResponse.json();

    // Check for details API errors
    if (detailsData.error) {
      console.error('YouTube Details API Error:', detailsData.error);
      // Return basic search results without details
      return NextResponse.json({ items: data.items });
    }

    // Combine search results with video details
    const enrichedItems = data.items.map(item => {
      const details = detailsData.items?.find(
        detail => detail.id === item.id.videoId
      );
      return {
        ...item,
        details: details || null
      };
    });

    return NextResponse.json({
      items: enrichedItems
    });
  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan saat mengambil data dari YouTube. Silakan coba lagi.',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 
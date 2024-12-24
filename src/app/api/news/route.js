import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=music OR concert OR album OR artist&` +
      `domains=billboard.com,rollingstone.com,pitchfork.com&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=12&` +
      `apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'Failed to fetch news');
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 
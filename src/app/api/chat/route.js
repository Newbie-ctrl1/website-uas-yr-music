import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    // Format chat history untuk Groq
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Tambahkan pesan sistem untuk memberikan konteks
    const systemMessage = {
      role: 'system',
      content: `Anda adalah asisten customer service yang ramah dan profesional untuk website YR Music - platform pembelian tiket event musik.
      Anda dapat membantu pengguna dengan:
      - Informasi tentang event
      - Cara pembelian tiket
      - Status pesanan
      - Masalah teknis
      - Pertanyaan umum seputar platform
      
      Selalu berikan respons yang ramah, informatif, dan dalam Bahasa Indonesia.`
    };

    // Buat chat completion dengan Groq
    const completion = await groq.chat.completions.create({
      messages: [systemMessage, ...formattedHistory, { role: 'user', content: message }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({
      response: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
} 
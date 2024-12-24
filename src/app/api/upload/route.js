import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;

    console.log('Uploading file:', {
      filename: file.name,
      mimeType: mimeType,
      size: buffer.length
    });

    // Simpan ke database
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO images (filename, data, mime_type)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [file.name, buffer, mimeType]
    );

    const imageId = result.rows[0].id;
    const imageUrl = `/api/images/${imageId}`;

    console.log('Image saved:', {
      id: imageId,
      url: imageUrl
    });

    // Return URL untuk mengakses gambar
    return NextResponse.json({ 
      url: imageUrl,
      id: imageId
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
} 
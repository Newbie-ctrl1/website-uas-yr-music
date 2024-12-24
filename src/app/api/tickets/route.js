import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Get tickets
export async function GET(request) {
  try {
    console.log('Fetching tickets...');
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const pool = await getPool();

    let queryText = `
      SELECT t.*, u.display_name as seller_name, u.email as seller_email
      FROM tickets t
      LEFT JOIN users u ON t.seller_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (sellerId) {
      queryText += ` AND t.seller_id = $${paramCount}`;
      values.push(sellerId);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (
        LOWER(t.title) LIKE $${paramCount} OR
        LOWER(t.description) LIKE $${paramCount} OR
        LOWER(t.venue) LIKE $${paramCount}
      )`;
      values.push(`%${search.toLowerCase()}%`);
      paramCount++;
    }

    if (category) {
      queryText += ` AND t.category = $${paramCount}`;
      values.push(category);
      paramCount++;
    }

    queryText += ' ORDER BY t.created_at DESC';

    console.log('Query:', queryText);
    console.log('Values:', values);

    const result = await pool.query(queryText, values);
    console.log('Query result:', result.rows);

    return NextResponse.json({ tickets: result.rows });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error.message },
      { status: 500 }
    );
  }
}

// Create ticket
export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received ticket data:', data);

    const {
      title,
      description,
      venue,
      event_date,
      price,
      quantity,
      image_url,
      seller_id,
      category,
      seller_name,
      seller_email
    } = data;

    // Validasi input
    if (!title || !venue || !event_date || !price || !quantity || !seller_id || !category) {
      return NextResponse.json(
        { message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    
    // Buat query untuk insert ticket
    const result = await pool.query(
      `INSERT INTO tickets (
        title,
        description,
        venue,
        event_date,
        price,
        quantity,
        remaining_quantity,
        image_url,
        seller_id,
        category,
        seller_name,
        seller_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        title,
        description || '',
        venue,
        new Date(event_date),
        parseFloat(price),
        parseInt(quantity),
        parseInt(quantity),
        image_url || null,
        seller_id,
        category,
        seller_name,
        seller_email
      ]
    );

    console.log('Ticket created:', result.rows[0]);

    return NextResponse.json({
      success: true,
      message: 'Event berhasil dibuat',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal membuat event' },
      { status: 500 }
    );
  }
}

// Update ticket
export async function PUT(request) {
  try {
    const data = await request.json();
    const {
      id,
      title,
      description,
      venue,
      eventDate,
      price,
      quantity,
      imageUrl,
      category,
    } = data;

    // Validasi input
    if (!id || !title || !venue || !eventDate || !price || !quantity || !category) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi harga
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice >= 1000000000) {
      return NextResponse.json(
        { error: 'Harga tidak valid (harus lebih dari 0 dan kurang dari 1 miliar)' },
        { status: 400 }
      );
    }

    // Validasi quantity
    const numericQuantity = parseInt(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      return NextResponse.json(
        { error: 'Jumlah tiket harus lebih dari 0' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE tickets SET
        title = $1,
        description = $2,
        venue = $3,
        event_date = $4,
        price = $5,
        quantity = $6,
        image_url = $7,
        category = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 RETURNING *`,
      [
        title,
        description || '',
        venue,
        new Date(eventDate),
        numericPrice,
        numericQuantity,
        imageUrl || null,
        category,
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error.message },
      { status: 500 }
    );
  }
}

// Delete ticket
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');
    const sellerId = searchParams.get('sellerId');

    if (!ticketId || !sellerId) {
      return NextResponse.json(
        { error: 'Ticket ID dan Seller ID diperlukan' },
        { status: 400 }
      );
    }

    const result = await deleteTicket(ticketId, sellerId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete ticket' },
      { status: 500 }
    );
  }
} 
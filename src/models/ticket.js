'use server';

import { getPool } from '@/lib/db';

export async function getTickets(params = {}) {
  try {
    const { userId, search } = params;
    const pool = await getPool();
    let queryText = `
      SELECT 
        t.*,
        u.display_name as seller_name,
        u.email as seller_email
      FROM tickets t
      LEFT JOIN users u ON t.seller_id = u.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (userId) {
      queryText += ` AND (
        t.seller_id = $${paramCount} OR
        t.event_date >= CURRENT_TIMESTAMP
      )`;
      values.push(userId);
      paramCount++;
    } else {
      queryText += ` AND t.event_date >= CURRENT_TIMESTAMP`;
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

    queryText += ' ORDER BY t.event_date ASC';

    const result = await pool.query(queryText, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
}

export async function getTicketById(id) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.price,
        t.event_date,
        t.venue,
        t.category,
        t.image_url,
        t.seller_id,
        t.created_at,
        t.updated_at,
        t.quantity,
        t.remaining_quantity,
        t.status
      FROM tickets t
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error getting ticket by id:', error);
    throw error;
  }
}

export async function createTicket(ticketData) {
  try {
    const pool = await getPool();
    const {
      title,
      description,
      price,
      event_date,
      venue,
      category,
      image_url,
      seller_id,
      quantity,
      event_query
    } = ticketData;

    // Validasi input
    if (!title || !venue || !event_date || !price || !quantity || !category || !seller_id) {
      throw new Error('Semua field wajib diisi');
    }

    // Validasi tanggal
    const eventDate = new Date(event_date);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Format tanggal tidak valid');
    }

    console.log('Creating ticket with data:', {
      title,
      description,
      price,
      event_date,
      venue,
      category,
      image_url,
      seller_id,
      quantity,
      event_query
    });

    const result = await pool.query(`
      INSERT INTO tickets (
        title,
        description,
        price,
        event_date,
        venue,
        category,
        image_url,
        seller_id,
        quantity,
        remaining_quantity,
        event_query
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10)
      RETURNING *
    `, [
      title,
      description,
      price,
      eventDate,
      venue,
      category,
      image_url,
      seller_id,
      quantity,
      event_query || 'public'
    ]);

    console.log('Created ticket:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function updateTicket(id, ticketData, sellerId) {
  try {
    const pool = await getPool();
    const {
      title,
      description,
      price,
      event_date,
      venue,
      category,
      image_url,
      quantity
    } = ticketData;

    // Validasi input
    if (!title || !venue || !event_date || !price || !quantity || !category) {
      throw new Error('Semua field wajib diisi');
    }

    // Validasi tanggal
    const eventDate = new Date(event_date);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Format tanggal tidak valid');
    }

    console.log('Updating ticket with data:', {
      id,
      title,
      description,
      price,
      event_date,
      venue,
      category,
      image_url,
      quantity
    });

    const result = await pool.query(`
      UPDATE tickets
      SET 
        title = $1,
        description = $2,
        price = $3,
        event_date = $4,
        venue = $5,
        category = $6,
        image_url = $7,
        quantity = $8,
        remaining_quantity = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      title,
      description || '',
      price,
      eventDate,
      venue,
      category,
      image_url,
      quantity,
      id
    ]);

    if (result.rows.length === 0) {
      throw new Error('Tiket tidak ditemukan');
    }

    console.log('Updated ticket:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
}

export async function deleteTicket(ticketId, sellerId) {
  const pool = await getPool();
  try {
    await pool.query('BEGIN');

    // Cek apakah tiket milik seller yang benar
    const ticketCheck = await pool.query(
      'SELECT seller_id FROM tickets WHERE id = $1',
      [ticketId]
    );

    console.log('Ticket check result:', {
      ticketId,
      sellerId,
      ticketSellerId: ticketCheck.rows[0]?.seller_id
    });

    if (ticketCheck.rows.length === 0) {
      throw new Error('Tiket tidak ditemukan');
    }

    // Konversi UUID jika dalam format yang berbeda
    const ticketSellerId = ticketCheck.rows[0].seller_id;
    
    if (ticketSellerId.toString() !== sellerId.toString()) {
      throw new Error('Anda tidak memiliki akses untuk menghapus tiket ini');
    }

    // Hapus notifikasi terlebih dahulu
    await pool.query(
      `DELETE FROM notifications 
       WHERE order_id IN (SELECT id FROM orders WHERE ticket_id = $1)`,
      [ticketId]
    );

    // Hapus ticket_codes
    await pool.query(
      `DELETE FROM ticket_codes 
       WHERE order_id IN (SELECT id FROM orders WHERE ticket_id = $1)`,
      [ticketId]
    );

    // Hapus orders
    await pool.query(
      'DELETE FROM orders WHERE ticket_id = $1',
      [ticketId]
    );

    // Hapus tiket
    const deleteResult = await pool.query(
      'DELETE FROM tickets WHERE id = $1 RETURNING *',
      [ticketId]
    );

    await pool.query('COMMIT');

    if (deleteResult.rows.length === 0) {
      throw new Error('Gagal menghapus tiket');
    }

    return {
      success: true,
      message: 'Tiket dan semua data terkait berhasil dihapus'
    };
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting ticket:', error);
    throw error;
  }
} 
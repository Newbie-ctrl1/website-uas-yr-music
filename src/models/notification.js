'use server';

import { getPool } from '@/lib/db';
import crypto from 'crypto';

export async function createNotification(userId, type, title, message, orderId, ticketCodes = null) {
  try {
    const pool = await getPool();
    
    // Buat query base
    const query = `
      INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        order_id
        ${ticketCodes ? ', ticket_codes' : ''}
      )
      VALUES (
        $1, $2, $3, $4, $5
        ${ticketCodes ? ', $6' : ''}
      )
      RETURNING *
    `;
    
    const values = [userId, type, title, message, orderId];
    if (ticketCodes) {
      values.push(ticketCodes);
    }
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function getNotifications(userId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT n.*, o.is_sent 
       FROM notifications n
       LEFT JOIN orders o ON n.order_id = o.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const pool = await getPool();
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1',
      [notificationId]
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function generateTicketCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

export async function sendTicketToCustomer(orderId, sellerId) {
  const pool = await getPool();
  
  try {
    await pool.query('BEGIN');
    
    // Get order details
    const orderResult = await pool.query(
      `SELECT o.*, t.title, t.seller_id, t.event_date,
              u_buyer.display_name as buyer_name,
              u_seller.display_name as seller_name
       FROM orders o
       JOIN tickets t ON o.ticket_id = t.id
       JOIN users u_buyer ON o.buyer_id = u_buyer.id
       JOIN users u_seller ON t.seller_id = u_seller.id
       WHERE o.id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Order tidak ditemukan');
    }
    
    const order = orderResult.rows[0];
    
    // Verify seller
    if (order.seller_id !== sellerId) {
      throw new Error('Anda tidak memiliki akses untuk mengirim tiket ini');
    }

    // Generate unique ticket codes for each ticket in the order
    const ticketCodes = [];
    const ticketDetails = [];

    // Format tanggal event
    const eventDate = new Date(order.event_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    for (let i = 0; i < order.quantity; i++) {
      const ticketCode = await generateTicketCode();
      ticketCodes.push(ticketCode);
      
      // Insert ticket code to ticket_codes table
      const ticketResult = await pool.query(
        `INSERT INTO ticket_codes (order_id, ticket_code, is_used)
         VALUES ($1, $2, false)
         RETURNING id`,
        [orderId, ticketCode]
      );

      // Create individual notification for each ticket
      const ticketNumber = i + 1;
      const ticketMessage = `Tiket #${ticketNumber}\nNomor Unik: ${ticketCode}\nID Tiket: ${ticketResult.rows[0].id}`;
      
      // Notification for buyer
      await pool.query(
        `INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          order_id,
          ticket_codes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.buyer_id,
          'TICKET_RECEIVED',
          `Tiket #${ticketNumber} Diterima`,
          `Tiket untuk event "${order.title}" pada ${eventDate}\n\n` +
          `${ticketMessage}\n\n` +
          'Simpan kode tiket ini dan tunjukkan saat event berlangsung.',
          orderId,
          [ticketCode]
        ]
      );

      ticketDetails.push({
        ticketNumber,
        ticketCode,
        ticketId: ticketResult.rows[0].id
      });
    }

    // Update order status
    await pool.query(
      'UPDATE orders SET is_sent = TRUE WHERE id = $1',
      [orderId]
    );

    // Create summary notification for seller
    const summaryMessage = ticketDetails.map(detail => 
      `Tiket #${detail.ticketNumber}\nNomor Unik: ${detail.ticketCode}\nID Tiket: ${detail.ticketId}`
    ).join('\n\n');

    await pool.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        order_id,
        ticket_codes
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sellerId,
        'TICKET_SENT',
        'Pengiriman Tiket Berhasil',
        `${order.quantity} tiket untuk event "${order.title}" telah berhasil dikirim ke ${order.buyer_name}\n\n` +
        `Detail Tiket:\n${summaryMessage}`,
        orderId,
        ticketCodes
      ]
    );
    
    await pool.query('COMMIT');
    return {
      success: true,
      message: 'Tiket berhasil dikirim',
      ticketDetails
    };
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error sending ticket:', error);
    throw error;
  }
}

export async function getOrderHistory(userId, isSeller = false) {
  try {
    const pool = await getPool();
    const query = isSeller
      ? `SELECT o.*, t.title, t.event_date, t.venue, u.display_name as buyer_name
         FROM orders o
         JOIN tickets t ON o.ticket_id = t.id
         JOIN users u ON o.buyer_id = u.id
         WHERE t.seller_id = $1
         ORDER BY o.created_at DESC`
      : `SELECT o.*, t.title, t.event_date, t.venue, u.display_name as seller_name
         FROM orders o
         JOIN tickets t ON o.ticket_id = t.id
         JOIN users u ON t.seller_id = u.id
         WHERE o.buyer_id = $1
         ORDER BY o.created_at DESC`;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting order history:', error);
    throw error;
  }
}

export async function sendTicket(orderId, sellerId) {
  const pool = await getPool();
  try {
    await pool.query('BEGIN');

    // Get order details with ticket codes
    const orderResult = await pool.query(
      `SELECT o.*, t.title, t.seller_id, t.event_date,
              u_buyer.display_name as buyer_name,
              u_seller.display_name as seller_name,
              array_agg(tc.ticket_code ORDER BY tc.id) as ticket_codes,
              array_agg(tc.id ORDER BY tc.id) as ticket_ids
       FROM orders o
       JOIN tickets t ON o.ticket_id = t.id
       JOIN users u_buyer ON o.buyer_id = u_buyer.id
       JOIN users u_seller ON t.seller_id = u_seller.id
       JOIN ticket_codes tc ON tc.order_id = o.id
       WHERE o.id = $1 AND t.seller_id = $2
       GROUP BY o.id, t.title, t.seller_id, t.event_date, u_buyer.display_name, u_seller.display_name`,
      [orderId, sellerId]
    );

    const order = orderResult.rows[0];
    if (!order) {
      throw new Error('Pesanan tidak ditemukan atau Anda tidak memiliki akses');
    }

    // Update order status
    await pool.query(
      'UPDATE orders SET is_sent = TRUE WHERE id = $1',
      [orderId]
    );

    // Format tanggal event
    const eventDate = new Date(order.event_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format pesan tiket dengan nomor unik
    const ticketMessage = order.ticket_codes.map((code, index) => 
      `Tiket #${index + 1}\nNomor Unik: ${code}\nID Tiket: ${order.ticket_ids[index]}`
    ).join('\n\n');

    // Create notification for buyer
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        order_id,
        ticket_codes
      ) VALUES ($1, $2, $3, $4, $5, $6::text[])`,
      [
        order.buyer_id,
        'Paket Diterima',
        `Paket untuk event "${order.title}" pada ${eventDate} telah dikirim oleh ${order.seller_name}.\n\n` +
        `Detail Tiket:\n${ticketMessage}\n\n` +
        'Simpan kode tiket ini dan tunjukkan saat event berlangsung.',
        'package_received',
        orderId,
        order.ticket_codes
      ]
    );

    // Create notification for seller
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        order_id,
        ticket_codes
      ) VALUES ($1, $2, $3, $4, $5, $6::text[])`,
      [
        sellerId,
        'Paket Terkirim',
        `${order.quantity} tiket untuk event "${order.title}" telah berhasil dikirim ke ${order.buyer_name}.\n\n` +
        `Detail Tiket:\n${ticketMessage}`,
        'package_sent',
        orderId,
        order.ticket_codes
      ]
    );

    await pool.query('COMMIT');
    return { 
      success: true, 
      message: 'Paket berhasil dikirim',
      ticketCodes: order.ticket_codes,
      ticketIds: order.ticket_ids
    };

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error sending ticket:', error);
    throw error;
  }
} 

export async function deleteNotification(notificationId, userId) {
  const pool = await getPool();
  try {
    // Verifikasi bahwa notifikasi milik user yang benar
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notifikasi tidak ditemukan atau Anda tidak memiliki akses');
    }

    return {
      success: true,
      message: 'Notifikasi berhasil dihapus'
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

export async function deleteAllNotifications(userId) {
  const pool = await getPool();
  try {
    await pool.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );

    return {
      success: true,
      message: 'Semua notifikasi berhasil dihapus'
    };
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
} 
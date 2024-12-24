'use server';

import { getPool } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function getWalletBalance(userId, walletType) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1 AND wallet_type = $2',
      [userId, walletType]
    );
    return result.rows[0]?.balance || 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
}

export async function topUpWallet(userId, walletType, amount) {
  const pool = await getPool();
  try {
    await pool.query('BEGIN');

    // Update saldo dompet
    await pool.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND wallet_type = $3',
      [amount, userId, walletType]
    );

    // Buat notifikasi top up
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type
      ) VALUES ($1, $2, $3, $4)`,
      [
        userId,
        'Top Up Berhasil',
        `Top up ${walletType} sebesar Rp${amount.toLocaleString()} berhasil`,
        'topup_success'
      ]
    );

    await pool.query('COMMIT');

    // Revalidate paths
    revalidatePath('/');
    revalidatePath('/profile');

    return {
      success: true,
      message: 'Top up berhasil'
    };

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error topping up wallet:', error);
    throw error;
  }
}

export async function purchaseTicketWithWallet(userId, ticketId, quantity, walletType) {
  const pool = await getPool();
  try {
    await pool.query('BEGIN');

    // 1. Cek saldo dompet
    const walletResult = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE',
      [userId, walletType]
    );
    
    const wallet = walletResult.rows[0];
    
    // 2. Cek harga dan ketersediaan tiket
    const ticketResult = await pool.query(
      `SELECT t.*, 
              u_buyer.display_name as buyer_name,
              u_seller.display_name as seller_name
       FROM tickets t 
       JOIN users u_buyer ON u_buyer.id = $3
       JOIN users u_seller ON u_seller.id = t.seller_id
       WHERE t.id = $1 AND t.remaining_quantity >= $2 
       FOR UPDATE`,
      [ticketId, quantity, userId]
    );
    
    const ticket = ticketResult.rows[0];
    if (!ticket) {
      throw new Error('Tiket tidak tersedia atau jumlah melebihi stok');
    }

    const totalPrice = ticket.price * quantity;
    if (wallet.balance < totalPrice) {
      throw new Error('Saldo tidak mencukupi');
    }

    // 3. Kurangi saldo dompet
    await pool.query(
      'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2 AND wallet_type = $3',
      [totalPrice, userId, walletType]
    );

    // 4. Kurangi stok tiket
    await pool.query(
      'UPDATE tickets SET remaining_quantity = remaining_quantity - $1 WHERE id = $2',
      [quantity, ticketId]
    );

    // 5. Buat order baru
    const orderResult = await pool.query(
      `INSERT INTO orders (
        buyer_id,
        ticket_id,
        quantity,
        total_price,
        payment_method,
        status,
        is_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id`,
      [userId, ticketId, quantity, totalPrice, walletType, 'completed', false]
    );

    // 6. Generate kode tiket untuk setiap tiket
    const ticketCodes = [];
    for (let i = 0; i < quantity; i++) {
      const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      ticketCodes.push(ticketCode);
      
      // Insert kode tiket ke tabel ticket_codes
      await pool.query(
        `INSERT INTO ticket_codes (
          order_id,
          ticket_code,
          is_used
        ) VALUES ($1, $2, $3)`,
        [orderResult.rows[0].id, ticketCode, false]
      );
    }

    // 7. Buat notifikasi untuk pembeli
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        order_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'Pembelian Tiket Berhasil',
        `Pembelian ${quantity} tiket ${ticket.title} berhasil dengan total Rp${totalPrice.toLocaleString()}. Menunggu penjual mengirim tiket.`,
        'purchase_success',
        orderResult.rows[0].id
      ]
    );

    // 8. Buat notifikasi untuk penjual di panel notifikasi
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        order_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        ticket.seller_id,
        'Pesanan Baru - Perlu Dikirim',
        `${ticket.buyer_name} telah memesan ${quantity} tiket ${ticket.title} dengan total Rp${totalPrice.toLocaleString()}. Silakan kirim tiket untuk menyelesaikan transaksi.`,
        'new_order',
        orderResult.rows[0].id
      ]
    );

    await pool.query('COMMIT');

    // Revalidate paths
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/tickets');

    return {
      success: true,
      orderId: orderResult.rows[0].id,
      message: 'Pembelian tiket berhasil'
    };

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error purchasing ticket:', error);
    throw error;
  }
}

export async function getAllWallets(userId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting wallets:', error);
    throw error;
  }
}

export async function getWalletTransactions(userId, walletType) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT 
        id,
        transaction_type,
        amount,
        description,
        created_at,
        order_id
       FROM wallet_transactions
       WHERE user_id = $1 AND wallet_type = $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, walletType]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    throw error;
  }
}

// Inisialisasi dompet untuk pengguna baru
export async function initializeWallets(userId) {
  const pool = await getPool();
  try {
    await pool.query('BEGIN');

    const walletTypes = ['RendiPay', 'ErwinPay', 'DindaPay'];
    
    for (const type of walletTypes) {
      await pool.query(
        'INSERT INTO wallets (user_id, wallet_type, balance) VALUES ($1, $2, 0) ON CONFLICT (user_id, wallet_type) DO NOTHING',
        [userId, type]
      );
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error initializing wallets:', error);
    throw error;
  }
} 
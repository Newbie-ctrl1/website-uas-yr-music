import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request) {
  const pool = await getPool();
  
  try {
    const { userId, ticketId, quantity, walletType } = await request.json();

    if (!userId || !ticketId || !quantity || !walletType) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    await pool.query('BEGIN');

    // 1. Dapatkan informasi tiket
    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      throw new Error('Tiket tidak ditemukan');
    }

    const ticket = ticketResult.rows[0];
    const totalPrice = ticket.price * quantity;

    // 2. Cek stok tiket
    if (ticket.remaining_quantity < quantity) {
      throw new Error('Stok tiket tidak mencukupi');
    }

    // 3. Dapatkan informasi dompet
    const walletResult = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1 AND wallet_type = $2',
      [userId, walletType]
    );

    if (walletResult.rows.length === 0) {
      throw new Error('Dompet tidak ditemukan');
    }

    const wallet = walletResult.rows[0];

    // 4. Cek saldo
    if (wallet.balance < totalPrice) {
      throw new Error('Saldo tidak mencukupi');
    }

    // 5. Kurangi saldo dompet
    await pool.query(
      `UPDATE wallets 
       SET balance = balance - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [totalPrice, wallet.id]
    );

    // 6. Catat transaksi wallet
    await pool.query(
      `INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        transaction_type,
        amount,
        description,
        status,
        wallet_type
      ) VALUES (
        $1,
        $2,
        'payment',
        $3,
        'Pembelian tiket ' || $4,
        'completed',
        $5
      )`,
      [wallet.id, userId, totalPrice, ticket.title, walletType]
    );

    // 7. Tambah saldo ke dompet penjual
    const sellerWalletResult = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1 AND wallet_type = $2',
      [ticket.seller_id, walletType]
    );

    if (sellerWalletResult.rows.length > 0) {
      const sellerWallet = sellerWalletResult.rows[0];
      await pool.query(
        `UPDATE wallets 
         SET balance = balance + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [totalPrice, sellerWallet.id]
      );

      // Catat transaksi untuk penjual
      await pool.query(
        `INSERT INTO wallet_transactions (
          wallet_id,
          user_id,
          transaction_type,
          amount,
          description,
          status,
          wallet_type
        ) VALUES (
          $1,
          $2,
          'sale',
          $3,
          'Penjualan tiket ' || $4,
          'completed',
          $5
        )`,
        [sellerWallet.id, ticket.seller_id, totalPrice, ticket.title, walletType]
      );
    }

    // 8. Update stok tiket
    await pool.query(
      `UPDATE tickets 
       SET remaining_quantity = remaining_quantity - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, ticketId]
    );

    // 9. Buat pesanan
    const orderResult = await pool.query(
      `INSERT INTO orders (
        user_id,
        ticket_id,
        quantity,
        total_price,
        payment_method,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'completed')
      RETURNING id`,
      [userId, ticketId, quantity, totalPrice, walletType]
    );

    // 10. Buat notifikasi untuk pembeli
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        status,
        order_id
      ) VALUES (
        $1,
        'Pembelian Tiket Berhasil',
        'Pembelian tiket ' || $2 || ' sebanyak ' || $3 || ' berhasil',
        'purchase',
        'unread',
        $4
      )`,
      [userId, ticket.title, quantity, orderResult.rows[0].id]
    );

    // 11. Buat notifikasi untuk penjual
    await pool.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        status,
        order_id
      ) VALUES (
        $1,
        'Tiket Terjual',
        'Tiket ' || $2 || ' terjual sebanyak ' || $3,
        'sale',
        'unread',
        $4
      )`,
      [ticket.seller_id, ticket.title, quantity, orderResult.rows[0].id]
    );

    await pool.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Pembelian tiket berhasil'
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error purchasing ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal melakukan pembelian' },
      { status: 500 }
    );
  }
} 
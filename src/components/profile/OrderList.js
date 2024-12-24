'use client';

import { useState, useEffect } from 'react';
import { Send, Package } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function OrderList({ userId, isSeller = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders for:', { userId, isSeller });
        const response = await fetch(`/api/orders?userId=${userId}&isSeller=${isSeller}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        console.log('Fetched orders:', data);
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchOrders();
    }
  }, [userId, isSeller]);

  const handleSendTicket = async (orderId) => {
    try {
      console.log('Sending ticket for order:', orderId);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Silakan login terlebih dahulu');
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/tickets/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengirim tiket');
      }

      // Refresh orders
      const updatedResponse = await fetch(`/api/orders?userId=${userId}&isSeller=${isSeller}`);
      const updatedData = await updatedResponse.json();
      setOrders(updatedData);

      alert('Tiket berhasil dikirim!');
    } catch (error) {
      console.error('Error sending ticket:', error);
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Memuat data...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {isSeller ? 'Belum ada penjualan' : 'Belum ada pembelian'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        console.log('Rendering order:', order);
        return (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{order.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.event_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {isSeller ? `Pembeli: ${order.buyer_name}` : `Penjual: ${order.seller_name}`}
                </p>
                <p className="text-sm text-gray-500">
                  Jumlah: {order.quantity} tiket
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Total: Rp{order.total_price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {order.is_sent ? 'Terkirim' : 'Belum dikirim'}
                </p>
              </div>
              {isSeller && !order.is_sent && (
                <button
                  onClick={() => handleSendTicket(order.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <Send size={16} />
                  Kirim Tiket
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 
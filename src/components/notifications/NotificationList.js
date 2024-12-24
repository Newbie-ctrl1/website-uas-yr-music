'use client';

import { useState, useEffect } from 'react';
import { Bell, Package, Clock, Check, Send, Trash2, X } from 'lucide-react';
import { getNotifications, markNotificationAsRead, sendTicketToCustomer, deleteNotification, deleteAllNotifications } from '@/models/notification';
import { auth } from '../../../lib/firebase';
import { format } from 'date-fns';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userNotifications = await getNotifications(userId);
        setNotifications(userNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Set up interval to refresh notifications
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSendTicket = async (orderId) => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      await sendTicketToCustomer(orderId, userId);
      await loadNotifications();
    } catch (error) {
      console.error('Error sending ticket:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const userId = auth.currentUser?.uid;
      await deleteNotification(notificationId, userId);
      // Refresh notifikasi setelah menghapus
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error.message);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      const userId = auth.currentUser?.uid;
      await deleteAllNotifications(userId);
      setShowConfirmDelete(false);
      // Refresh notifikasi setelah menghapus semua
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      setError(error.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PURCHASE':
        return <Bell className="text-blue-500" />;
      case 'TICKET_SENT':
        return <Package className="text-green-500" />;
      case 'TICKET_RECEIVED':
        return <Check className="text-purple-500" />;
      case 'package_sent':
        return <Package className="text-green-500" />;
      case 'package_received':
        return <Package className="text-blue-500" />;
      default:
        return <Clock className="text-gray-500" />;
    }
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return date;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Notifikasi</h3>
        {notifications.length > 0 && (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={16} />
            Hapus Semua
          </button>
        )}
      </div>
      
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">Konfirmasi Hapus</h4>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAllNotifications}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
      
      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Belum ada notifikasi
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.is_read ? 'bg-white' : 'bg-purple-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                        title="Hapus notifikasi"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  
                  {notification.type === 'new_order' && !notification.is_sent && (
                    <button
                      onClick={() => handleSendTicket(notification.order_id)}
                      className="mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Send size={16} />
                      Kirim Tiket
                    </button>
                  )}
                  
                  {notification.type === 'PURCHASE' && !notification.is_sent && (
                    <button
                      onClick={() => handleSendTicket(notification.order_id)}
                      className="mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Package size={16} />
                      Kirim Paket
                    </button>
                  )}
                  
                  {notification.ticket_codes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-gray-600">Detail Tiket:</p>
                      {notification.ticket_codes.map((code, index) => (
                        <div key={index} className="p-2 bg-white rounded border">
                          <p className="font-medium text-gray-800">Tiket #{index + 1}</p>
                          <p className="font-mono text-sm">Nomor Unik: {code}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
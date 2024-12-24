'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertCircle, Package, Check, Clock, X, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { auth } from '@/lib/firebase';
import { 
  deleteNotification, 
  deleteAllNotifications,
  sendTicketToCustomer 
} from '@/lib/notificationService';

export default function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      const response = await fetch(`/api/notifications/${userId}`);
      const data = await response.json();

      if (data.error) throw new Error(data.error);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const userId = auth.currentUser?.uid;
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError(error.message);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Memuat notifikasi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-800">Notifikasi</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Hapus Semua"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Confirm Delete Modal */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Hapus Semua Notifikasi?
              </h3>
              <p className="text-gray-600 mb-4">
                Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
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

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Belum ada notifikasi
            </div>
          ) : (
            <div className="space-y-3 p-4">
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
                            {format(new Date(notification.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
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
      </div>
    </div>
  );
} 
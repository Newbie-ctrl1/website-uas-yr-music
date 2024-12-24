'use client';

import { useState, useEffect, useCallback } from 'react';
import { Home, Search, LogOut, User, Ticket, ChevronRight, Tag, Wallet, CreditCard, Coins, Diamond, X, Bell, Clock } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { getAllWallets, topUpWallet } from '@/models/wallet';
import { getOrderHistory } from '@/models/notification';
import NotificationList from '../notifications/NotificationList';
import { format } from 'date-fns';

export default function Sidebar({ activeTab, setActiveTab }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showProfileTab, setShowProfileTab] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [orderType, setOrderType] = useState('buyer');

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const loadWallets = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userWallets = await getAllWallets(userId);
        setWallets(userWallets);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      setError('Gagal memuat informasi dompet');
    }
  };

  const loadOrders = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userOrders = await getOrderHistory(userId, orderType === 'seller');
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Gagal memuat riwayat pesanan');
    }
  }, [orderType]);

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (activeProfileTab === 'orders') {
      loadOrders();
    }
  }, [activeProfileTab, loadOrders]);

  const handleTopUp = async () => {
    try {
      setLoading(true);
      setError(null);

      const amount = parseInt(topUpAmount);
      if (!amount || amount <= 0) {
        throw new Error('Jumlah top up harus lebih dari 0');
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Silakan login terlebih dahulu');
      }

      await topUpWallet(userId, selectedWallet, amount);
      
      // Refresh wallet data
      await loadWallets();
      
      // Reset form
      setTopUpAmount('');
      setShowTopUpModal(false);
      setSelectedWallet(null);

    } catch (error) {
      console.error('Error topping up wallet:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openTopUpModal = (walletName) => {
    setSelectedWallet(walletName);
    setShowTopUpModal(true);
  };

  const walletIcons = {
    'RendiPay': <CreditCard size={20} className="text-blue-500" />,
    'ErwinPay': <Coins size={20} className="text-green-500" />,
    'DindaPay': <Diamond size={20} className="text-pink-500" />
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return date;
    }
  };

  return (
    <>
      <div className={`w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 ${showProfileTab ? 'z-10' : 'z-20'}`}>
        <div className="flex-1 flex flex-col space-y-6">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`p-3 rounded-xl ${activeTab === 'home' ? 'active' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Home size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('events')} 
            className={`p-3 rounded-xl ${activeTab === 'events' ? 'active' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Ticket size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('search')} 
            className={`p-3 rounded-xl ${activeTab === 'search' ? 'active' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Search size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('marketplace')} 
            className={`p-3 rounded-xl ${activeTab === 'marketplace' ? 'active' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Tag size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <button 
              onClick={() => setIsWalletOpen(!isWalletOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
            >
              <Wallet size={24} className="text-gray-500" />
            </button>

            {isWalletOpen && (
              <div className="absolute left-full ml-2 bottom-0 w-56 bg-white rounded-lg shadow-lg overflow-hidden z-30">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Dompet Digital</h3>
                </div>
                {wallets.map((wallet) => (
                  <div 
                    key={wallet.wallet_type}
                    className="px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {walletIcons[wallet.wallet_type]}
                        <span className="text-sm font-medium text-gray-700">{wallet.wallet_type}</span>
                      </div>
                      <span className="text-sm text-gray-500">Rp {wallet.balance.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowProfileTab(!showProfileTab)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getInitials(auth.currentUser?.email)}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Tab */}
      {showProfileTab && (
        <div className="fixed top-0 right-0 h-screen w-96 bg-white shadow-lg z-30 overflow-hidden flex flex-col">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Profil</h2>
              <button 
                onClick={() => setShowProfileTab(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-2xl font-medium text-white">
                  {getInitials(auth.currentUser?.email)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{auth.currentUser?.displayName || 'User'}</h2>
                <p className="text-gray-500">{auth.currentUser?.email}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setActiveProfileTab('profile')}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  activeProfileTab === 'profile'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Profil
              </button>
              <button
                onClick={() => setActiveProfileTab('notifications')}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  activeProfileTab === 'notifications'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Notifikasi
              </button>
              <button
                onClick={() => setActiveProfileTab('orders')}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  activeProfileTab === 'orders'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pesanan
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeProfileTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dompet Digital</h3>
                  <div className="grid gap-4">
                    {wallets.map((wallet) => (
                      <div key={wallet.wallet_type} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {walletIcons[wallet.wallet_type]}
                            <span className="font-medium text-gray-800">{wallet.wallet_type}</span>
                          </div>
                          <span className="text-lg font-semibold">
                            Rp {wallet.balance.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => openTopUpModal(wallet.wallet_type)}
                          className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Top Up
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'notifications' && (
              <NotificationList />
            )}

            {activeProfileTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setOrderType('buyer')}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      orderType === 'buyer'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pembelian
                  </button>
                  <button
                    onClick={() => setOrderType('seller')}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      orderType === 'seller'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Penjualan
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 bg-white rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{order.title}</h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Jumlah: {order.quantity} tiket</p>
                        <p>Total: Rp {order.total_price.toLocaleString()}</p>
                        <p>Pembayaran: {order.payment_method}</p>
                        {orderType === 'buyer' && (
                          <p>Penjual: {order.seller_name}</p>
                        )}
                        {orderType === 'seller' && (
                          <p>Pembeli: {order.buyer_name}</p>
                        )}
                      </div>

                      {order.ticket_code && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Kode Tiket:</p>
                          <p className="font-mono font-medium">{order.ticket_code}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {orders.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      Belum ada pesanan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t">
            <button 
              onClick={() => auth.signOut()}
              className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Top Up {selectedWallet}</h3>
              <button 
                onClick={() => {
                  setShowTopUpModal(false);
                  setSelectedWallet(null);
                  setTopUpAmount('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Top Up
                </label>
                <input
                  type="number"
                  placeholder="Masukkan jumlah"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleTopUp}
                disabled={loading}
                className={`w-full py-2 rounded-lg text-white font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading ? 'Memproses...' : 'Konfirmasi Top Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
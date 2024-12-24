'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { User, Settings, CreditCard, Bell, Package, LogOut, ChevronRight, Wallet } from 'lucide-react';
import NotificationPanel from '@/components/notification/NotificationPanel';
import OrderList from '@/components/profile/OrderList';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        fetchWallets(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWallets = async (userId) => {
    try {
      // Inisialisasi wallet terlebih dahulu
      await fetch('/api/wallets/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      // Kemudian ambil data wallet
      const response = await fetch(`/api/wallets/${userId}`);
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 p-8">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 p-8">
        <div className="text-center">
          <p className="text-gray-600">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'profile',
      label: 'Profil Saya',
      icon: User,
      description: 'Kelola informasi pribadi Anda'
    },
    {
      id: 'notifications',
      label: 'Notifikasi',
      icon: Bell,
      description: 'Lihat pemberitahuan terbaru'
    },
    {
      id: 'orders',
      label: 'Pesanan',
      icon: Package,
      description: 'Riwayat pembelian tiket'
    }
  ];

  const WALLET_TYPES = {
    'DindaPay': {
      color: 'from-purple-600 to-indigo-600',
      icon: '💜',
      description: 'Dompet Digital by Dinda'
    },
    'RendiPay': {
      color: 'from-blue-600 to-cyan-600',
      icon: '💙',
      description: 'Dompet Digital by Rendi'
    },
    'ErwinPay': {
      color: 'from-pink-600 to-rose-600',
      icon: '❤️',
      description: 'Dompet Digital by Erwin'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl mb-8 border border-purple-100">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {user.displayName || 'User'}
              </h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-purple-100 overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-4 transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'hover:bg-purple-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-purple-600'} />
                    <div className="text-left">
                      <p className="font-medium">{item.label}</p>
                      <p className={`text-sm ${
                        activeTab === item.id ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className={activeTab === item.id ? 'text-white' : 'text-gray-400'} />
                </button>
              ))}
            </div>

            <button
              onClick={() => auth.signOut()}
              className="w-full mt-4 p-4 bg-white/80 backdrop-blur-md rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-purple-100 p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Informasi Pribadi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={user.displayName || ''}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={user.email || ''}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wallets Section */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Dompet Digital</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {wallets.map((wallet) => {
                        const walletConfig = WALLET_TYPES[wallet.wallet_type];
                        return (
                          <div
                            key={wallet.wallet_type}
                            className={`bg-gradient-to-br ${walletConfig.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{walletConfig.icon}</span>
                                <div>
                                  <span className="text-lg font-medium block">{wallet.wallet_type}</span>
                                  <span className="text-sm opacity-75">{walletConfig.description}</span>
                                </div>
                              </div>
                              <Wallet className="w-6 h-6 opacity-75" />
                            </div>
                            <div>
                              <p className="text-sm opacity-75">Saldo Tersedia</p>
                              <p className="text-2xl font-bold">
                                Rp {wallet.balance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && <NotificationPanel />}
              {activeTab === 'orders' && <OrderList userId={user.uid} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
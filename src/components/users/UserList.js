'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Wallet, Search, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const DEFAULT_WALLETS = ['RendiPay', 'ErwinPay', 'DindaPay'];

export default function UserList({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUserWallets = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/wallets?userId=${userId}`);
      if (!response.ok) throw new Error('Gagal mengambil data dompet');
      const data = await response.json();
      
      return DEFAULT_WALLETS.map(type => {
        const existingWallet = data.find(w => w.wallet_type === type);
        return existingWallet || {
          wallet_type: type,
          balance: 0
        };
      });
    } catch (error) {
      console.error('Error fetching wallets:', error);
      return DEFAULT_WALLETS.map(type => ({
        wallet_type: type,
        balance: 0
      }));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      const usersWithWallets = await Promise.all(
        data.map(async (user) => {
          const wallets = await fetchUserWallets(user.id);
          return { ...user, wallets };
        })
      );
      
      setUsers(usersWithWallets);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, [fetchUserWallets]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 min-h-screen p-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <User className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {user.display_name || 'Pengguna'}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-sm text-purple-600">(Anda)</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.wallets.map((wallet, index) => (
                  <div
                    key={wallet.wallet_type}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="text-purple-600" size={20} />
                      <h4 className="font-medium text-gray-800">
                        {wallet.wallet_type}
                      </h4>
                    </div>
                    <p className="text-xl font-bold text-purple-600">
                      {formatPrice(wallet.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada pengguna yang ditemukan
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
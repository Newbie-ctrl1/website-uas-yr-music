'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, History, ArrowUpRight, ArrowDownLeft, AlertCircle, RefreshCcw, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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

export default function WalletPanel() {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWalletDetails, setShowWalletDetails] = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      console.log('Fetching wallets for user:', userId);
      if (!userId) {
        console.log('No user ID found');
        setError('Silakan login terlebih dahulu');
        return;
      }

      setLoading(true);
      setError(null);

      // Inisialisasi wallet terlebih dahulu
      await fetch('/api/wallets/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      // Ambil data wallet
      const response = await fetch(`/api/wallets/${userId}`);
      const data = await response.json();
      console.log('Wallet data received:', data);

      if (data.error) throw new Error(data.error);

      // Pastikan semua tipe wallet ada
      const defaultWallets = ['DindaPay', 'RendiPay', 'ErwinPay'];
      const existingWalletTypes = data.map(w => w.wallet_type);
      
      // Tambahkan wallet yang belum ada dengan saldo 0
      const missingWallets = defaultWallets
        .filter(type => !existingWalletTypes.includes(type))
        .map(type => ({
          wallet_type: type,
          balance: 0,
          user_id: userId
        }));

      setWallets([...data, ...missingWallets]);
      console.log('Wallets set to state:', [...data, ...missingWallets]);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      setError('Gagal memuat informasi dompet');
      // Set default wallets jika gagal fetch
      const defaultWallets = ['DindaPay', 'RendiPay', 'ErwinPay'].map(type => ({
        wallet_type: type,
        balance: 0,
        user_id: auth.currentUser?.uid
      }));
      setWallets(defaultWallets);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const response = await fetch(`/api/transactions/${userId}`);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Gagal memuat riwayat transaksi');
    }
  }, []);

  const initializeWallets = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      console.log('Initializing wallets for user:', userId);
      if (!userId) {
        console.log('No user ID found during initialization');
        setError('Silakan login terlebih dahulu');
        return;
      }

      setLoading(true);
      setError(null);

      // Inisialisasi wallet
      const initResponse = await fetch('/api/wallets/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const initData = await initResponse.json();
      console.log('Initialization response:', initData);

      if (initData.error) throw new Error(initData.error);

      // Ambil data wallet
      await fetchWallets();
      await fetchTransactions();
    } catch (error) {
      console.error('Error initializing wallets:', error);
      setError('Gagal menginisialisasi dompet');
      setWallets([]); // Reset wallets state on error
    } finally {
      setLoading(false);
    }
  }, [fetchWallets, fetchTransactions]);

  useEffect(() => {
    console.log('Component mounted, initializing wallets');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.uid);
      if (user) {
        initializeWallets();
      }
    });

    return () => unsubscribe();
  }, [initializeWallets]);

  // Tambahkan useEffect untuk debugging state
  useEffect(() => {
    console.log('Current wallets state:', wallets);
    console.log('Show wallet details:', showWalletDetails);
  }, [wallets, showWalletDetails]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !selectedWallet || !amount) return;

      const response = await fetch('/api/wallets/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          walletType: selectedWallet,
          amount: Number(amount)
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Refresh wallets and transactions
      await fetchWallets();
      await fetchTransactions();

      // Reset form
      setAmount('');
      setShowTopUpModal(false);
    } catch (error) {
      console.error('Error topping up wallet:', error);
      setError('Gagal melakukan top up');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state jika tidak ada wallet
  if (wallets.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada dompet digital yang tersedia</p>
          <button
            onClick={() => {
              setLoading(true);
              initializeWallets().finally(() => setLoading(false));
            }}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Inisialisasi Dompet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Wallet Summary */}
      <div 
        className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setShowWalletDetails(!showWalletDetails)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Dompet Digital</h2>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLoading(true);
              fetchWallets().finally(() => setLoading(false));
            }}
          >
            <RefreshCcw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="text-gray-600">
          {showWalletDetails ? 'Klik untuk menyembunyikan detail' : 'Klik untuk melihat detail saldo'}
        </div>
      </div>

      {/* Wallet Details */}
      {showWalletDetails && (
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
                <div className="space-y-4">
                  <div>
                    <p className="text-sm opacity-75">Saldo Tersedia</p>
                    <p className="text-2xl font-bold">
                      Rp {wallet.balance?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWallet(wallet.wallet_type);
                      setShowTopUpModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Top Up Saldo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-800">Riwayat Transaksi</h2>
            </div>
            <button
              onClick={fetchTransactions}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada transaksi</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'topup' ? (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ArrowUpRight className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {transaction.type === 'topup' ? 'Top Up' : 'Pembayaran'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'topup' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'topup' ? '+' : '-'}
                      Rp {transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.wallet_type}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Top Up {selectedWallet}</h3>
                <button
                  onClick={() => setShowTopUpModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleTopUp} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Top Up
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    required
                    min="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Minimal top up Rp 10.000
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : 'Top Up Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Wallet, CreditCard, Plus, History, ArrowUpRight, ArrowDownLeft, AlertCircle, RefreshCcw } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function WalletPanel() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchWallets(user.uid);
        fetchTransactions(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWallets = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wallets/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      setError('Gagal memuat dompet');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      const response = await fetch(`/api/transactions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!selectedWallet || !amount) return;

    try {
      const response = await fetch('/api/wallets/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: selectedWallet,
          amount: parseFloat(amount)
        }),
      });

      if (!response.ok) throw new Error('Failed to top up wallet');

      setShowTopUpModal(false);
      setSelectedWallet(null);
      setAmount('');
      fetchWallets();
      fetchTransactions();
    } catch (error) {
      console.error('Error topping up wallet:', error);
      alert('Gagal melakukan top up');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600">Memuat dompet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <Wallet className="w-8 h-8" />
              <span className="text-sm font-medium opacity-75">{wallet.wallet_type}</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-75">Saldo</p>
                <p className="text-2xl font-bold">
                  Rp {wallet.balance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedWallet(wallet.id);
                  setShowTopUpModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Top Up</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm">
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
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {transaction.type === 'topup' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-800 font-medium">
                        {transaction.type === 'topup' ? 'Top Up' : 'Pembayaran'}
                      </p>
                      <p className={`font-medium ${
                        transaction.type === 'topup' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'topup' ? '+' : '-'}
                        Rp {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CreditCard className="w-4 h-4" />
                      <span>{transaction.wallet_type}</span>
                      <span className="text-gray-300">•</span>
                      <time>
                        {format(new Date(transaction.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </time>
                    </div>
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
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800">Top Up Saldo</h3>
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
                    className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUpModal(false);
                    setSelectedWallet(null);
                    setAmount('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
                >
                  Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
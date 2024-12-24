'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Coins, 
  Diamond, 
  Wallet,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  MinusCircle,
  PlusCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react';
import { getAllWallets, purchaseTicketWithWallet } from '@/models/wallet';
import { auth } from '../../../lib/firebase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PurchaseTicketModal({ ticket, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [error, setError] = useState(null);

  const walletIcons = {
    'RendiPay': <CreditCard size={20} className="text-blue-500" />,
    'ErwinPay': <Coins size={20} className="text-green-500" />,
    'DindaPay': <Diamond size={20} className="text-pink-500" />
  };

  const loadWallets = async () => {
    try {
      setLoadingWallets(true);
      setError(null);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Silakan login terlebih dahulu');
      }

      // Inisialisasi wallet terlebih dahulu
      await fetch('/api/wallets/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      // Ambil data wallet
      const userWallets = await getAllWallets(userId);
      console.log('Loaded wallets:', userWallets);
      setWallets(userWallets);
    } catch (error) {
      console.error('Error loading wallets:', error);
      setError('Gagal memuat informasi dompet');
    } finally {
      setLoadingWallets(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const totalPrice = ticket.price * quantity;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedWallet) {
        throw new Error('Silakan pilih metode pembayaran');
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Silakan login terlebih dahulu');
      }

      // Cek saldo dompet yang dipilih
      const selectedWalletData = wallets.find(w => w.wallet_type === selectedWallet);
      if (!selectedWalletData || selectedWalletData.balance < totalPrice) {
        alert(`Saldo ${selectedWallet} tidak mencukupi. Silakan top up terlebih dahulu.`);
        throw new Error(`Saldo ${selectedWallet} tidak mencukupi. Silakan top up terlebih dahulu.`);
      }

      await purchaseTicketWithWallet(userId, ticket.id, quantity, selectedWallet);
      
      // Refresh wallet data setelah pembelian berhasil
      await loadWallets();
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cek apakah saldo cukup untuk pembelian
  const isBalanceSufficient = () => {
    if (!selectedWallet) return false;
    const selectedWalletData = wallets.find(w => w.wallet_type === selectedWallet);
    return selectedWalletData && selectedWalletData.balance >= totalPrice;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-800">Beli Tiket</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informasi Tiket */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <h4 className="font-semibold text-lg text-gray-800 mb-3">{ticket.title}</h4>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                <span className="text-sm">
                  {format(new Date(ticket.event_date), 'EEEE, dd MMMM yyyy', { locale: id })}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-purple-500" />
                <span className="text-sm">
                  {format(new Date(ticket.event_date), 'HH:mm', { locale: id })} WIB
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                <span className="text-sm">{ticket.venue}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Ticket className="w-4 h-4 mr-2 text-purple-500" />
                <span className="text-sm">{ticket.remaining_quantity} tiket tersedia</span>
              </div>
            </div>
          </div>

          {/* Input Jumlah */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Ticket className="w-4 h-4 text-purple-500" />
              Jumlah Tiket
            </label>
            <div className="flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
              >
                <MinusCircle size={20} />
              </button>
              <input
                type="number"
                min="1"
                max={ticket.remaining_quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(ticket.remaining_quantity, parseInt(e.target.value) || 1)))}
                className="w-16 text-center bg-white border border-gray-200 rounded-lg py-1.5 text-gray-800 font-medium"
              />
              <button
                onClick={() => setQuantity(Math.min(ticket.remaining_quantity, quantity + 1))}
                className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Wallet className="w-4 h-4 text-purple-500" />
              Metode Pembayaran
            </label>
            {loadingWallets ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={loadWallets}
                    className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            ) : wallets.length === 0 ? (
              <div className="p-4 bg-yellow-50 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">Tidak ada dompet digital yang tersedia.</p>
                  <button
                    onClick={loadWallets}
                    className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.wallet_type}
                    onClick={() => setSelectedWallet(wallet.wallet_type)}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      selectedWallet === wallet.wallet_type
                        ? wallet.balance >= totalPrice
                          ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                          : 'border-red-500 bg-red-50 ring-1 ring-red-500'
                        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {walletIcons[wallet.wallet_type]}
                        <div className="text-left">
                          <p className="font-medium">{wallet.wallet_type}</p>
                          <p className={`text-sm ${wallet.balance < totalPrice ? 'text-red-500' : 'text-gray-500'}`}>
                            Saldo: Rp {wallet.balance.toLocaleString()}
                            {wallet.balance < totalPrice && selectedWallet === wallet.wallet_type && (
                              <span className="block text-xs text-red-500 mt-0.5">
                                Saldo tidak mencukupi
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {selectedWallet === wallet.wallet_type && (
                        <BadgeCheck className={`w-5 h-5 ${
                          wallet.balance >= totalPrice ? 'text-purple-600' : 'text-red-500'
                        }`} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total Pembayaran */}
          <div className="border-t border-gray-100 pt-4">
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Harga per tiket</span>
                <span className="font-medium">Rp {parseInt(ticket.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Jumlah tiket</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="border-t border-gray-200 my-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">Total Pembayaran</span>
                  <span className="text-lg font-bold text-purple-600">
                    Rp {totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handlePurchase}
              disabled={loading || !isBalanceSufficient()}
              className={`w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all ${
                loading || !isBalanceSufficient()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 transform hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet size={20} />
              )}
              {loading ? 'Memproses Pembayaran...' : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
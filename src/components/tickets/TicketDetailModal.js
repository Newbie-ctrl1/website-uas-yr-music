'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Calendar, MapPin, Music2, Tag, User, Mail, Wallet, CreditCard, Coins, Diamond } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { auth } from '../../../lib/firebase';
import { PLACEHOLDER_IMAGE, IMAGE_SIZES } from '@/lib/constants';

export default function TicketDetailModal({ ticket, onClose, onBuy }) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const response = await fetch(`/api/wallets?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      setError('Gagal memuat dompet');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    const imageUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    return imageUrl || null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBuy = async () => {
    if (!auth.currentUser) {
      alert('Silakan login terlebih dahulu untuk membeli tiket');
      return;
    }

    if (!selectedWallet) {
      alert('Silakan pilih metode pembayaran');
      return;
    }

    if (quantity > ticket.remaining_quantity) {
      alert('Jumlah tiket yang diminta melebihi stok yang tersedia');
      return;
    }

    const selectedWalletData = wallets.find(w => w.wallet_type === selectedWallet);
    if (!selectedWalletData) {
      alert('Metode pembayaran tidak valid');
      return;
    }

    const totalPrice = ticket.price * quantity;
    if (selectedWalletData.balance < totalPrice) {
      alert('Saldo tidak mencukupi. Silakan top up terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      await onBuy(quantity, selectedWallet);
      onClose();
    } catch (error) {
      alert(error.message || 'Gagal melakukan pembelian. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const walletIcons = {
    'RendiPay': <CreditCard className="w-5 h-5 text-blue-500" />,
    'ErwinPay': <Coins className="w-5 h-5 text-green-500" />,
    'DindaPay': <Diamond className="w-5 h-5 text-pink-500" />
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Detail Tiket Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Image */}
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-6">
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(ticket.image_url) || PLACEHOLDER_IMAGE}
                alt={ticket.title || 'Event image'}
                fill
                className="object-cover"
                sizes={IMAGE_SIZES.DETAIL}
                priority
              />
              {!ticket.image_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music2 size={48} className="text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">{ticket.title}</h3>
            <p className="text-gray-600">{ticket.description}</p>
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="text-blue-600" size={20} />
              <span>{formatDate(ticket.event_date)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="text-blue-600" size={20} />
              <span>{ticket.venue}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Tag className="text-blue-600" size={20} />
              <span className="capitalize">{ticket.category}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <User className="text-blue-600" size={20} />
              <span>{ticket.seller_name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="text-blue-600" size={20} />
              <span>{ticket.seller_email}</span>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Harga per tiket</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(ticket.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Stok tersedia</p>
                <p className="text-lg font-semibold">
                  {ticket.remaining_quantity} tiket
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Tiket
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={ticket.remaining_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(
                    Math.max(1, parseInt(e.target.value) || 1),
                    ticket.remaining_quantity
                  ))}
                  className="w-20 text-center border border-gray-300 rounded-md px-2 py-1"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(quantity + 1, ticket.remaining_quantity))}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </label>
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.wallet_type}
                    onClick={() => setSelectedWallet(wallet.wallet_type)}
                    className={`w-full p-4 rounded-xl border ${
                      selectedWallet === wallet.wallet_type
                        ? wallet.balance >= ticket.price * quantity
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {walletIcons[wallet.wallet_type]}
                        <div className="text-left">
                          <p className="font-medium">{wallet.wallet_type}</p>
                          <p className={`text-sm ${wallet.balance < ticket.price * quantity ? 'text-red-500' : 'text-gray-500'}`}>
                            Saldo: Rp {wallet.balance.toLocaleString()}
                            {wallet.balance < ticket.price * quantity && selectedWallet === wallet.wallet_type && (
                              <span className="block text-xs text-red-500">
                                Saldo tidak mencukupi
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {selectedWallet === wallet.wallet_type && (
                        <div className={`w-4 h-4 rounded-full ${
                          wallet.balance >= ticket.price * quantity ? 'bg-blue-600' : 'bg-red-600'
                        }`}></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Total Pembayaran</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(ticket.price * quantity)}
                </span>
              </div>

              <button
                onClick={handleBuy}
                disabled={isLoading || quantity > ticket.remaining_quantity || !selectedWallet}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memproses...' : 'Beli Tiket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
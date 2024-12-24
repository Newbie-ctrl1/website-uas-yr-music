'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, MapPin, Search, Filter, Tag, Clock, Ticket, AlertCircle, Music2, Wallet } from 'lucide-react';
import Image from 'next/image';
import PurchaseTicketModal from '../ticket/PurchaseTicketModal';
import { auth } from '../../../lib/firebase';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: '', label: 'Semua Kategori' },
    { value: 'concert', label: 'Konser' },
    { value: 'festival', label: 'Festival' },
    { value: 'theater', label: 'Teater' },
    { value: 'sport', label: 'Olahraga' },
    { value: 'other', label: 'Lainnya' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tickets');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.tickets.filter(ticket => 
        new Date(ticket.event_date) >= new Date()
      ));
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Gagal memuat events');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = (ticket) => {
    if (!auth.currentUser) {
      alert('Silakan login terlebih dahulu untuk membeli tiket');
      return;
    }
    setSelectedTicket(ticket);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    fetchEvents();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === '' || event.category === selectedCategory;

    const price = parseFloat(event.price);
    const matchesMinPrice = minPrice === '' || price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || price <= parseFloat(maxPrice);

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600">Memuat event...</p>
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
    <div className="space-y-8 bg-gradient-to-b from-purple-200 via-purple-50 to-white/50 p-8 min-h-screen rounded-3xl backdrop-blur-sm">
      {/* Search & Filter Section */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm p-6 space-y-4 border border-purple-100">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            <span>Filter</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span>Kategori</span>
                </div>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Minimal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Maksimal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tanpa batas"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/70 backdrop-blur-md rounded-2xl border border-purple-100">
          <Ticket className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Tidak Ada Event</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory || minPrice || maxPrice
              ? 'Tidak ada event yang sesuai dengan filter'
              : 'Belum ada event yang tersedia'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group bg-white/80 backdrop-blur-md rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-purple-100/50 hover:border-purple-200"
            >
              <div className="relative h-36 bg-gradient-to-br from-purple-100 to-indigo-100">
                {event.image_url ? (
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Music2 className="w-12 h-12 text-purple-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {event.seller_id === auth.currentUser?.uid && (
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs font-medium">
                      Event Saya
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-white/90 rounded-full text-xs font-medium text-purple-600">
                    {event.category || 'Umum'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="border-b border-gray-100 pb-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                  {event.title}
                </h3>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="bg-purple-50/50 rounded-lg p-2">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-purple-500" />
                      <span className="text-xs font-medium">
                      {format(new Date(event.event_date), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                      <Clock className="w-3.5 h-3.5 mr-2 text-purple-500" />
                      <span className="text-xs font-medium">
                      {format(new Date(event.event_date), 'HH:mm', { locale: id })} WIB
                    </span>
                  </div>
                  </div>

                  <div className="bg-purple-50/50 rounded-lg p-2">
                  <div className="flex items-center text-gray-600">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-purple-500 flex-shrink-0" />
                      <span className="text-xs font-medium line-clamp-1">{event.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                  <div>
                      <p className="text-xs text-gray-500 mb-0.5">Harga Tiket</p>
                    <p className="text-sm font-bold text-purple-600">
                      Rp {parseInt(event.price).toLocaleString()}
                    </p>
                  </div>
                    {event.remaining_quantity > 0 && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg font-medium">
                        {event.remaining_quantity} tersisa
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBuyTicket(event)}
                    disabled={event.seller_id === auth.currentUser?.uid}
                    className={`w-full py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5 ${
                      event.seller_id === auth.currentUser?.uid
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Wallet size={16} />
                    {event.seller_id === auth.currentUser?.uid ? 'Event Milik Anda' : 'Beli Tiket'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedTicket && (
        <PurchaseTicketModal
          ticket={selectedTicket}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedTicket(null);
          }}
          onSuccess={() => {
            handlePurchaseSuccess();
            setShowPurchaseModal(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
} 
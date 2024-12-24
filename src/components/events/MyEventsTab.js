'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, MapPin, Search, Filter, Tag, Clock, Ticket, AlertCircle, Music2, Plus, Edit, Trash, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { auth } from '../../../lib/firebase';
import EditEventModal from '../tickets/EditEventModal';

export default function MyEventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const categories = [
    { value: '', label: 'Semua Kategori' },
    { value: 'concert', label: 'Konser' },
    { value: 'festival', label: 'Festival' },
    { value: 'theater', label: 'Teater' },
    { value: 'sport', label: 'Olahraga' },
    { value: 'other', label: 'Lainnya' }
  ];

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/tickets/my-tickets/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.tickets);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Gagal memuat events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return;

    try {
      const response = await fetch(`/api/tickets/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      fetchMyEvents(); // Refresh list setelah menghapus
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Gagal menghapus event');
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedEvent(null);
    fetchMyEvents(); // Refresh list setelah edit
  };

  const handleViewDetail = (event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === '' || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Event Saya</h2>
        <button
          onClick={() => {/* TODO: Implement create event */}}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Buat Event</span>
        </button>
      </div>

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
          <div className="pt-4 border-t border-gray-100">
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
          </div>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/70 backdrop-blur-md rounded-2xl border border-purple-100">
          <Ticket className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Event</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory
              ? 'Tidak ada event yang sesuai dengan filter'
              : 'Anda belum memiliki event. Klik tombol "Buat Event" untuk membuat event baru.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, index) => (
            <div
              key={event.id}
              className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-purple-100/50 hover:border-purple-200 transition-all duration-200 overflow-hidden group"
            >
              <div className="p-4 flex items-center gap-4">
                {/* Nomor & Status */}
                <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-lg text-purple-600 font-bold">
                  {index + 1}
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      new Date(event.event_date) > new Date() 
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`} title={new Date(event.event_date) > new Date() ? 'Aktif' : 'Selesai'} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.event_date), 'dd MMM yyyy, HH:mm', { locale: id })} WIB
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {categories.find(c => c.value === event.category)?.label || 'Umum'}
                    </span>
                    <span className="flex items-center gap-1 text-purple-600 font-medium">
                      <Ticket className="w-4 h-4" />
                      Rp {parseInt(event.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetail(event)}
                    className="p-2 text-gray-500 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Event"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Event"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Detail Event</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEvent(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image */}
              {selectedEvent.image_url && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Title & Description */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedEvent.title}</h3>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tanggal & Waktu</p>
                  <div className="flex items-center gap-2 text-gray-800">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span>{format(new Date(selectedEvent.event_date), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-800 mt-1">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>{format(new Date(selectedEvent.event_date), 'HH:mm', { locale: id })} WIB</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Lokasi</p>
                  <div className="flex items-center gap-2 text-gray-800">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span>{selectedEvent.venue}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Kategori</p>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-500" />
                    <span className="px-2 py-1 bg-purple-50 rounded-full text-sm font-medium text-purple-600">
                      {categories.find(c => c.value === selectedEvent.category)?.label || 'Umum'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      new Date(selectedEvent.event_date) > new Date() 
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      new Date(selectedEvent.event_date) > new Date() 
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {new Date(selectedEvent.event_date) > new Date() ? 'Aktif' : 'Selesai'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Info */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Harga Tiket</p>
                    <p className="text-2xl font-bold text-purple-600">
                      Rp {parseInt(selectedEvent.price).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Sisa Tiket</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedEvent.remaining_quantity} / {selectedEvent.quantity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
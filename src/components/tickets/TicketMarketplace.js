'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { auth } from '../../lib/firebase';
import { Plus, Ticket, Calendar, MapPin, Tag, Clock, Trash2, Edit2, AlertCircle, Sparkles } from 'lucide-react';
import TicketCard from './TicketCard';
import CreateTicketForm from './CreateTicketForm';
import EditTicketForm from './EditTicketForm';
import TicketDetailModal from './TicketDetailModal';
import { deleteTicket } from '../../models/ticket';

export default function TicketMarketplace() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState(null);
  const [isEventCreator, setIsEventCreator] = useState(false);
  const [view, setView] = useState('my');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      const userTickets = data.tickets.filter(ticket => 
        ticket.seller_id === auth.currentUser?.uid
      );
      setTickets(userTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Gagal memuat tiket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchTickets();
  };

  const handleEditSuccess = () => {
    setSelectedTicket(null);
    fetchTickets();
  };

  const handleDelete = async (ticketId) => {
    if (!auth.currentUser) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus tiket ini?')) {
      try {
        const sellerId = auth.currentUser.uid;
        await deleteTicket(ticketId, sellerId);
        alert('Tiket berhasil dihapus');
        fetchTickets();
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert(error.message || 'Gagal menghapus tiket. Silakan coba lagi.');
      }
    }
  };

  const handleEdit = (ticket) => {
    if (ticket.seller_id !== auth.currentUser?.uid) {
      alert('Anda hanya dapat mengedit event yang Anda buat');
      return;
    }
    setSelectedTicket(ticket);
  };

  const handleTicketClick = (ticket) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    if (ticket.seller_id === currentUser.uid) {
      setSelectedTicket(ticket);
    } else if (isEventCreator || new Date(ticket.event_date) >= new Date()) {
      setSelectedTicketForDetail(ticket);
    } else {
      alert('Event ini sudah selesai');
    }
  };

  const handleBuyTicket = async (quantity, walletType) => {
    if (!auth.currentUser) {
      throw new Error('Silakan login terlebih dahulu');
    }

    if (!selectedTicketForDetail) {
      throw new Error('Tiket tidak ditemukan');
    }

    const response = await fetch('/api/tickets/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: auth.currentUser.uid,
        ticketId: selectedTicketForDetail.id,
        quantity,
        walletType
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Gagal melakukan pembelian');
    }

    await fetchTickets();
  };

  return (
    <div className="bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 min-h-screen p-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-12 text-center">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <Sparkles className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Event Saya</h2>
          <p className="text-gray-600">Kelola semua event yang Anda buat</p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-10">
          {auth.currentUser && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Buat Event Baru</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Memuat event Anda...</p>
          </div>
        ) : (
          <>
            {/* Event Grid */}
            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
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
                          <h3 className="font-medium text-gray-900 truncate">{ticket.title}</h3>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            new Date(ticket.event_date) > new Date() 
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`} title={new Date(ticket.event_date) > new Date() ? 'Aktif' : 'Selesai'} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(ticket.event_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {' '}
                            {new Date(ticket.event_date).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {ticket.venue}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {ticket.category || 'Umum'}
                          </span>
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <Ticket className="w-4 h-4" />
                            Rp {parseInt(ticket.price).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(ticket)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-white/70 backdrop-blur-md rounded-2xl border border-purple-100">
                <Ticket className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Event</h3>
                <p className="text-gray-500">
                  Anda belum memiliki event. Klik tombol &quot;Buat Event&quot; untuk membuat event baru.
                </p>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showCreateForm && (
          <CreateTicketForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {selectedTicket && (
          <EditTicketForm
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {selectedTicketForDetail && (
          <TicketDetailModal
            ticket={selectedTicketForDetail}
            onClose={() => setSelectedTicketForDetail(null)}
            onBuy={handleBuyTicket}
          />
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Music2, Calendar, MapPin, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { PLACEHOLDER_IMAGE, IMAGE_SIZES } from '@/lib/constants';

// Fungsi formatPrice lokal sebagai pengganti import
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export default function TicketCard({ ticket, onDelete, onEdit, onClick, isOwner, isEventCreator }) {
  const [imageError, setImageError] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;
    console.log('Original image URL:', url);
    
    try {
      new URL(url);
      return url;
    } catch {
      const imageUrl = url.startsWith('/') ? `${window.location.origin}${url}` : `${window.location.origin}/${url}`;
      console.log('Processed image URL:', imageUrl);
      return imageUrl;
    }
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

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(ticket);
  };

  const isLiveEvent = () => {
    const now = new Date();
    const eventDate = new Date(ticket.event_date);
    return eventDate >= now;
  };

  const canViewDetails = isOwner || isEventCreator || isLiveEvent();

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        canViewDetails ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed opacity-75'
      } transition-all duration-200`}
      onClick={() => canViewDetails && onClick(ticket)}
    >
      <div className="relative w-full h-48 bg-gray-100">
        <div className="relative w-full h-full">
          <Image
            src={getImageUrl(ticket.image_url)}
            alt={ticket.title || 'Event image'}
            fill
            className="object-cover"
            sizes={IMAGE_SIZES.THUMBNAIL}
            onError={(e) => {
              console.error('Image load error:', e);
              setImageError(true);
            }}
            priority
          />
          {!ticket.image_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 size={48} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <span className="bg-white/90 px-2 py-1 rounded-full text-sm font-medium">
            {ticket.category}
          </span>
          {!isLiveEvent() && (
            <span className="bg-red-500/90 text-white px-2 py-1 rounded-full text-sm font-medium">
              Event Selesai
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{ticket.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span>{formatDate(ticket.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span>{ticket.venue}</span>
          </div>
          {ticket.seller_name && (
            <div className="text-sm text-gray-500">
              Penyelenggara: {ticket.seller_name}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-purple-600">
              {formatPrice(ticket.price)}
            </p>
            <p className="text-sm text-gray-500">
              Tersisa: {ticket.remaining_quantity} tiket
            </p>
          </div>

          <div className="flex gap-2">
            {isOwner && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Hapus event"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={handleEdit}
                  className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                  title="Edit event"
                >
                  <Edit2 size={20} />
                </button>
              </>
            )}
            {canViewDetails && !isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/event/${ticket.id}`, '_blank');
                }}
                className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                title="Lihat detail"
              >
                <ExternalLink size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
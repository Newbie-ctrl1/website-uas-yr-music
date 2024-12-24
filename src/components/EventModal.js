'use client';

import { X, Calendar, MapPin, Clock, Ticket, Bell, Video } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

export default function EventModal({ event, onClose }) {
  const isVirtualEvent = event.venue?.type === 'Virtual';
  const isLive = () => {
    if (!event.datetime || !event.venue.timezone) return false;
    const eventTime = new Date(event.datetime);
    const now = new Date();
    const diffMinutes = (eventTime - now) / (1000 * 60);
    return diffMinutes <= 15 && diffMinutes >= -(60 * 4);
  };

  const formatEventTime = (datetime, timezone) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: timezone
    }).format(new Date(datetime));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Detail Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Event Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">
              {event.title || `${event.artist.name} Live Concert`}
            </h3>
            {event.artist.image_url && (
              <div className="flex items-center gap-3 mb-4">
                <ImageWithFallback
                  src={event.artist.image_url}
                  alt={event.artist.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <span className="font-medium">{event.artist.name}</span>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="text-purple-600" size={20} />
              <span>{formatEventTime(event.datetime, event.venue.timezone)}</span>
            </div>

            {isVirtualEvent ? (
              <div className="flex items-center gap-3 text-gray-700">
                <Video className="text-purple-600" size={20} />
                <span>Streaming LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="text-purple-600" size={20} />
                <span>
                  {event.venue.name}, {event.venue.city}
                  {event.venue.country && `, ${event.venue.country}`}
                </span>
              </div>
            )}

            {event.description && (
              <p className="text-gray-600 mt-4">{event.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {isVirtualEvent && isLive() ? (
              <a
                href={`${event.url}&trigger=watch_live`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                <Video size={20} />
                <span>Watch Live</span>
              </a>
            ) : event.offers && event.offers.length > 0 ? (
              <a
                href={`${event.offers[0].url}&app_id=${process.env.NEXT_PUBLIC_BANDSINTOWN_APP_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                <Ticket size={20} />
                <span>Beli Tiket</span>
              </a>
            ) : (
              <a
                href={`${event.url}&trigger=notify_me`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                <Bell size={20} />
                <span>Notify Me</span>
              </a>
            )}

            <a
              href={`${event.url}&trigger=rsvp_going`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-purple-600 text-purple-600 rounded-full hover:bg-purple-50 transition-colors"
            >
              <Calendar size={20} />
              <span>RSVP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 
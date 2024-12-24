'use client';

import { Search, Play, Clock } from 'lucide-react';
import Image from 'next/image';

export default function SearchTab({
  musicSearchQuery,
  setMusicSearchQuery,
  musicSearchResults,
  handleMusicSelect,
  formatYouTubeDuration,
  formatViewCount
}) {
  return (
    <div className="bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 min-h-screen p-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Cari & Putar Musik
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Temukan dan dengarkan musik favorit Anda dari berbagai artis dan genre
          </p>
        </div>

        {/* Search Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input 
              type="text" 
              value={musicSearchQuery}
              onChange={(e) => setMusicSearchQuery(e.target.value)}
              placeholder="Cari lagu, artis, atau album..." 
              className="w-full p-4 pl-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {/* Music Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {musicSearchResults.map((music, index) => (
            <MusicCard
              key={music.id.videoId}
              music={music}
              index={index}
              onSelect={handleMusicSelect}
              formatDuration={formatYouTubeDuration}
              formatViews={formatViewCount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MusicCard({ music, index, onSelect, formatDuration, formatViews }) {
  return (
    <div
      onClick={() => onSelect(music, index)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      <div className="relative aspect-video">
        <Image
          src={music.snippet.thumbnails.high.url}
          alt={music.snippet.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={48} className="text-white" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {music.snippet.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3">
          {music.snippet.channelTitle}
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>
              {music.details?.contentDetails?.duration
                ? formatDuration(music.details.contentDetails.duration)
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Play size={14} />
            <span>
              {music.details?.statistics?.viewCount
                ? formatViews(music.details.statistics.viewCount)
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { TrendingUp, Music2, Calendar, ExternalLink, Clock, Newspaper } from 'lucide-react';
import ImageWithFallback from '../ImageWithFallback';

export default function HomeTab({ newsData, newsLoading, newsError, formatDate }) {
  if (newsError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
        {newsError}
      </div>
    );
  }

  if (newsLoading) {
    return (
      <div className="space-y-8">
        {/* Featured News Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
          <div className="w-full h-[400px] bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Regular News Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          YR Music News
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Temukan berita terbaru dari dunia musik, konser, album, dan artis favorit Anda
        </p>
      </div>

      <div className="space-y-12">
        {/* Featured News */}
        {newsData.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              Featured Story
            </h2>
            <FeaturedNewsCard article={newsData[0]} formatDate={formatDate} />
          </div>
        )}

        {/* Latest News */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="text-blue-600" />
            Latest News
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsData.slice(1).map((article, index) => (
              <NewsCard key={index} article={article} formatDate={formatDate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedNewsCard({ article, formatDate }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
    >
      <div className="relative h-[400px] overflow-hidden">
        {article.urlToImage ? (
          <ImageWithFallback
            src={article.urlToImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Music2 size={64} className="text-gray-400" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            {article.title}
          </h3>
          <p className="text-gray-200 line-clamp-2 mb-4">
            {article.description}
          </p>
          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-white group-hover:text-blue-400 transition-colors">
              <span>Read full story</span>
              <ExternalLink size={16} />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

function NewsCard({ article, formatDate }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
    >
      <div className="relative h-48 overflow-hidden">
        {article.urlToImage ? (
          <ImageWithFallback
            src={article.urlToImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Music2 size={48} className="text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
          Music News
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {article.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 group-hover:gap-2 transition-all">
            <span className="text-sm">Read more</span>
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
    </a>
  );
} 
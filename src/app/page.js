'use client';

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import Login from '../components/Login';
import EventModal from '../components/EventModal';
import MusicPlayer from '../components/MusicPlayer';
import Sidebar from '../components/layout/Sidebar';
import HomeTab from '../components/home/HomeTab';
import EventsTab from '../components/events/EventsTab';
import SearchTab from '../components/search/SearchTab';
import TicketMarketplace from '../components/tickets/TicketMarketplace';

export default function HomePage() {
  // Auth State
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('home');

  // News State
  const [newsData, setNewsData] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // Events State
  const [eventsData, setEventsData] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [searchArtist, setSearchArtist] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [artistData, setArtistData] = useState(null);
  const [recommendedArtists, setRecommendedArtists] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Music State
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);

  // Fetch News
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setNewsData(data.articles);
        setNewsLoading(false);
      } catch (error) {
        setNewsError(error.message || 'Failed to load music news');
        setNewsLoading(false);
      }
    };

    if (activeTab === 'home') {
      fetchNews();
    }
  }, [activeTab]);

  // Search Artists Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchArtist.length >= 3) {
        setDebouncedSearch(searchArtist);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchArtist]);

  // Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      if (activeTab !== 'events') return;
      if (debouncedSearch.length < 3 && !searchArtist) return;
      
      setEventsLoading(true);
      try {
        const response = await fetch(`/api/events?artist=${encodeURIComponent(debouncedSearch || searchArtist || 'coldplay')}`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setEventsData(data);
        setEventsLoading(false);
      } catch (error) {
        setEventsError('Tidak dapat menemukan event untuk artis tersebut');
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [activeTab, debouncedSearch, searchArtist]);

  // Search Artists
  const searchArtists = async (query) => {
    if (query.length < 2) {
      setArtistData(null);
      setRecommendedArtists([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/artists/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setArtistData(data.artist);
      setRecommendedArtists(data.recommended);
      setEventsData(data.events);
    } catch (error) {
      setEventsError('Tidak dapat menemukan artis');
    } finally {
      setIsSearching(false);
      setEventsLoading(false);
    }
  };

  // Search Artists Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchArtist.length >= 2) {
        searchArtists(searchArtist);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchArtist]);

  // Search Music
  const searchMusic = async (query) => {
    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMusicSearchResults(data.items);
    } catch (error) {
      console.error('Error searching music:', error);
    }
  };

  // Search Music Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (musicSearchQuery && activeTab === 'search') {
        searchMusic(musicSearchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [musicSearchQuery, activeTab]);

  // Music Player Handlers
  const handleMusicSelect = (music, index) => {
    setSelectedMusic(music);
    setCurrentMusicIndex(index);
  };

  const handleNextTrack = () => {
    if (currentMusicIndex < musicSearchResults.length - 1) {
      handleMusicSelect(musicSearchResults[currentMusicIndex + 1], currentMusicIndex + 1);
    }
  };

  const handlePreviousTrack = () => {
    if (currentMusicIndex > 0) {
      handleMusicSelect(musicSearchResults[currentMusicIndex - 1], currentMusicIndex - 1);
    }
  };

  // Format Functions
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatYouTubeDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let result = '';
    
    if (hours) result += `${hours}:`;
    if (minutes) result += `${minutes.padStart(2, '0')}:`;
    else result += '00:';
    if (seconds) result += seconds.padStart(2, '0');
    else result += '00';

    return result;
  };

  const formatViewCount = (count) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderTab = () => {
    switch(activeTab) {
      case 'home':
        return (
          <HomeTab
            newsData={newsData}
            newsLoading={newsLoading}
            newsError={newsError}
            formatDate={formatDate}
          />
        );
      case 'events':
        return (
          <EventsTab
            searchArtist={searchArtist}
            setSearchArtist={setSearchArtist}
            artistData={artistData}
            recommendedArtists={recommendedArtists}
            eventsData={eventsData}
            eventsError={eventsError}
            isSearching={isSearching}
            formatEventDate={formatEventDate}
            setSelectedEvent={setSelectedEvent}
          />
        );
      case 'search':
        return (
          <SearchTab
            musicSearchQuery={musicSearchQuery}
            setMusicSearchQuery={setMusicSearchQuery}
            musicSearchResults={musicSearchResults}
            handleMusicSelect={handleMusicSelect}
            formatYouTubeDuration={formatYouTubeDuration}
            formatViewCount={formatViewCount}
          />
        );
      case 'marketplace':
        return <TicketMarketplace />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTab()}
      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Music Player */}
      {selectedMusic && (
        <div className={`fixed ${isPlayerFullscreen ? 'inset-0' : 'left-0 right-0 bottom-0'} z-50`}>
          <MusicPlayer
            videoId={selectedMusic.id.videoId}
            onClose={() => setSelectedMusic(null)}
            onNext={handleNextTrack}
            onPrevious={handlePreviousTrack}
            isFullscreen={isPlayerFullscreen}
            onToggleFullscreen={() => setIsPlayerFullscreen(!isPlayerFullscreen)}
          />
        </div>
      )}
    </div>
  );
}
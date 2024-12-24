'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, X } from 'lucide-react';

export default function MusicPlayer({ videoId, onClose, onNext, onPrevious, isFullscreen, onToggleFullscreen }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  const onPlayerReady = useCallback((event) => {
    setDuration(event.target.getDuration());
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  }, []);

  const onPlayerStateChange = useCallback((event) => {
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
  }, []);

  const initializePlayer = useCallback(() => {
    if (window.YT) {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: isFullscreen ? '100%' : '70',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    }
  }, [videoId, isFullscreen, onPlayerReady, onPlayerStateChange]);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      window.onYouTubeIframeAPIReady = null;
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [initializePlayer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleMuteToggle = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime);
    }
  };

  const handleClose = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    onClose();
  };

  return (
    <div className={`bg-black text-white ${isFullscreen ? 'fixed inset-0 z-50' : 'fixed bottom-0 left-0 right-0 h-[70px] shadow-lg z-50'}`}>
      <div className="relative h-full flex items-center">
        {/* YouTube Player (hidden in mini mode) */}
        <div id="youtube-player" className={`${isFullscreen ? 'w-full h-screen' : 'w-[120px]'}`} />
        
        {/* Mini Player Content */}
        <div className={`${isFullscreen ? 'hidden' : 'flex-1 px-4'}`}>
          <div className="flex items-center justify-between h-full">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button onClick={onPrevious} className="p-1 hover:text-blue-400 transition-colors">
                <SkipBack size={16} />
              </button>
              <button onClick={handlePlayPause} className="p-1.5 bg-white text-black rounded-full hover:bg-blue-400 hover:text-white transition-all">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={onNext} className="p-1 hover:text-blue-400 transition-colors">
                <SkipForward size={16} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 mx-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Volume and Fullscreen */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button onClick={handleMuteToggle} className="p-1 hover:text-blue-400 transition-colors">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button 
                onClick={onToggleFullscreen}
                className="p-1 hover:text-blue-400 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                onClick={handleClose}
                className="p-1 hover:text-red-400 transition-colors ml-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Fullscreen Controls Overlay */}
        {isFullscreen && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="mb-2">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={onPrevious} className="p-1 hover:text-blue-400 transition-colors">
                  <SkipBack size={20} />
                </button>
                <button onClick={handlePlayPause} className="p-2 bg-white text-black rounded-full hover:bg-blue-400 hover:text-white transition-all">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={onNext} className="p-1 hover:text-blue-400 transition-colors">
                  <SkipForward size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={handleMuteToggle} className="p-1 hover:text-blue-400 transition-colors">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button 
                  onClick={onToggleFullscreen}
                  className="p-1 hover:text-blue-400 transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
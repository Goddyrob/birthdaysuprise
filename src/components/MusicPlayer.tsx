import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Upload, Play, Pause } from 'lucide-react';
import { musicPlayer } from '../utils/audio';

interface MusicPlayerProps {
  customMusicTitle?: string;
  onUploadCustomMusic?: (file: File) => void;
  dark?: boolean;
  canUpload?: boolean;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  customMusicTitle = 'Romantic Melody 🎵',
  onUploadCustomMusic,
  dark = false,
  canUpload = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check initial state
    setIsPlaying(musicPlayer.getIsPlaying());
  }, []);

  const handleToggle = () => {
    const newState = musicPlayer.toggle();
    setIsPlaying(newState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    musicPlayer.setVolume(val);
    if (val === 0) {
      musicPlayer.pause();
      setIsPlaying(false);
    } else if (!isPlaying) {
      musicPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCustomMusic) {
      onUploadCustomMusic(file);
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md transition-all shadow-md ${
          dark
            ? 'bg-black/60 border border-white/20 text-white'
            : 'bg-white/80 border border-pink-200 text-pink-900'
        }`}
      >
        {/* Play/Pause Button */}
        <button
          onClick={handleToggle}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
          className={`p-1.5 rounded-full transition-transform active:scale-95 ${
            dark ? 'hover:bg-white/10 text-pink-300' : 'hover:bg-pink-100 text-pink-600'
          }`}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Animated Sound Wave Bars */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 cursor-pointer select-none"
        >
          <div className="flex items-end gap-0.5 h-4 w-4">
            <span
              className={`w-1 rounded-full bg-pink-500 transition-all ${
                isPlaying ? 'animate-pulse h-4' : 'h-1.5'
              }`}
            />
            <span
              className={`w-1 rounded-full bg-pink-400 transition-all ${
                isPlaying ? 'animate-pulse h-3' : 'h-2.5'
              }`}
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className={`w-1 rounded-full bg-pink-500 transition-all ${
                isPlaying ? 'animate-pulse h-4' : 'h-1'
              }`}
              style={{ animationDelay: '0.3s' }}
            />
          </div>

          <span className="text-xs font-medium max-w-[120px] truncate hidden sm:inline-block ml-1">
            {customMusicTitle}
          </span>
        </div>

        {/* Expandable Controls (Volume & Upload) */}
        {isExpanded && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-pink-300/40">
            <button
              onClick={() => {
                const newVol = volume > 0 ? 0 : 0.4;
                setVolume(newVol);
                musicPlayer.setVolume(newVol);
                if (newVol > 0 && !isPlaying) {
                  musicPlayer.play();
                  setIsPlaying(true);
                } else if (newVol === 0) {
                  musicPlayer.pause();
                  setIsPlaying(false);
                }
              }}
              className="text-pink-500 hover:text-pink-600"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />

            {canUpload && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Your Own Song (MP3)"
                  className="p-1 text-pink-500 hover:text-pink-600 rounded"
                >
                  <Upload size={15} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Plus, Sparkles, Settings, Eye, Heart } from 'lucide-react';
import { PhotoItem } from '../types';
import { PhotoLightbox } from './PhotoLightbox';

interface SpaceGallerySceneProps {
  photos: PhotoItem[];
  recipientName: string;
  onReplay: () => void;
  onOpenSettings?: () => void;
  onAddPhotos?: (files: FileList) => void;
  onOpenLoveReasons?: () => void;
  isRecipientMode?: boolean;
  onCreateOwn?: () => void;
}

export const SpaceGalleryScene: React.FC<SpaceGallerySceneProps> = ({
  photos,
  recipientName,
  onReplay,
  onOpenSettings,
  onAddPhotos,
  onOpenLoveReasons,
  isRecipientMode = false,
  onCreateOwn,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; opacity: number; animDuration: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate starry sky
  useEffect(() => {
    const starList = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      animDuration: Math.random() * 3 + 2,
    }));
    setStars(starList);
  }, []);

  // Parallax on mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 20;
    const y = (e.clientY / innerHeight - 0.5) * 20;
    setMouseOffset({ x, y });
  };

  // Touch parallax for mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const { innerWidth, innerHeight } = window;
      const x = (touch.clientX / innerWidth - 0.5) * 15;
      const y = (touch.clientY / innerHeight - 0.5) * 15;
      setMouseOffset({ x, y });
    }
  };

  const selectPhotoAt = (index: number) => {
    const normalizedIndex = (index + photos.length) % photos.length;
    setSelectedIndex(normalizedIndex);
    setSelectedPhoto(photos[normalizedIndex] || null);
  };

  // Ensure default positions for any added photos
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="relative min-h-screen w-full overflow-hidden bg-[#06070e] text-white flex flex-col justify-between select-none"
    >
      {/* Background Cosmic Starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white transition-opacity"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: star.size > 2 ? '0 0 6px rgba(255, 255, 255, 0.8)' : 'none',
              animation: `pulse-slow ${star.animDuration}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* Ambient Nebula Glows */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-pink-900/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-purple-900/15 rounded-full blur-[120px]" />
      </div>

      {/* Floating Header Banner */}
      <header className="relative z-20 pt-16 sm:pt-6 px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-block"
        >
          <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200 bg-clip-text text-transparent tracking-tight">
            Our Constellation of Memories ✨
          </h2>
          <p className="text-[11px] sm:text-sm text-pink-300/80 mt-1 font-medium">
            Tap any star photo to view memories in detail
          </p>
        </motion.div>
      </header>

      {/* Responsive editorial memory gallery */}
      <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-12">
        <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-5 md:grid-cols-4 md:auto-rows-[180px] lg:auto-rows-[210px]">
          {photos.map((photo, index) => (
            <motion.button
              key={photo.id || index}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              onClick={() => { setSelectedPhoto(photo); setSelectedIndex(index); }}
              className={`group relative min-h-0 overflow-hidden rounded-2xl border border-white/15 bg-[#18181f] text-left shadow-[0_12px_35px_rgba(0,0,0,0.45)] ${index === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : index === 3 ? 'col-span-2 md:col-span-2' : ''}`}
            >
              <img
                src={photo.url}
                alt={photo.caption || `Memory ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-xs font-medium text-white sm:text-sm">
                {photo.caption || photo.date || 'Memory'}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-white opacity-0 transition group-hover:opacity-100">
                <Eye size={17} aria-hidden="true" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <footer className="relative z-30 pb-6 px-4 flex items-center justify-center gap-3 sm:gap-4">
        {/* Replay Experience Button */}
        {!isRecipientMode && <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReplay}
          className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 rounded-full text-xs sm:text-sm font-semibold text-white shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw size={16} className="text-pink-400" />
          <span>Replay Journey</span>
        </motion.button>}

        {/* Add More Photos Button */}
        {!isRecipientMode && <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full text-xs sm:text-sm font-semibold text-white shadow-lg shadow-pink-500/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Photos</span>
        </motion.button>}
        {!isRecipientMode && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (onAddPhotos && e.target.files && e.target.files.length > 0) {
                onAddPhotos(e.target.files);
              }
            }}
          />
        )}

        {/* Love Reasons / Sweet Quotes Button */}
        {onOpenLoveReasons && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenLoveReasons}
            className="px-4 sm:px-5 py-2.5 sm:py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 rounded-full text-xs sm:text-sm font-semibold text-rose-200 shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Heart size={16} className="text-pink-400 fill-pink-400" />
            <span>Love Reasons</span>
          </motion.button>
        )}

        {/* Customization Settings Button */}
        {!isRecipientMode && onOpenSettings && <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 rounded-full text-white shadow-lg flex items-center justify-center transition-colors cursor-pointer"
          title="Customize Photos & Messages"
        >
          <Settings size={18} className="text-pink-400" />
        </motion.button>}
      </footer>

      {isRecipientMode && onCreateOwn && (
        <section className="relative z-30 border-t border-white/10 bg-black/25 px-5 py-8 text-center safe-area-bottom">
          <p className="font-serif text-xl text-pink-100">Loved this surprise?</p>
          <button
            type="button"
            onClick={onCreateOwn}
            className="mt-3 rounded-full border border-pink-300/50 bg-pink-500/20 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-pink-500/35"
          >
            Create Your Own Surprise
          </button>
        </section>
      )}

      {/* Lightbox Modal for Photo Details */}
      <PhotoLightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photos={photos}
        photoIndex={selectedIndex}
        onPrevious={() => selectPhotoAt(selectedIndex - 1)}
        onNext={() => selectPhotoAt(selectedIndex + 1)}
      />
    </div>
  );
};

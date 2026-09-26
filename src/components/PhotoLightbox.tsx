import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoItem } from '../types';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  onClose: () => void;
  photos?: PhotoItem[];
  photoIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photo, onClose, photos = [], photoIndex = 0, onPrevious, onNext }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious?.();
      if (event.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  if (!photo) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `memory-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Click outside backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Polaroid Card Lightbox (Matching 00:23 in reference video) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md bg-white p-4 sm:p-6 pb-6 sm:pb-8 rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center select-none"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close photo"
            className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-800 shadow-xl border border-gray-200 flex items-center justify-center hover:bg-pink-50 hover:text-pink-600 transition-colors cursor-pointer z-30"
          >
            <X size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={onPrevious}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-xl hover:bg-pink-50 hover:text-pink-600"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={onNext}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-xl hover:bg-pink-50 hover:text-pink-600"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Photo container */}
          <div className="w-full aspect-[4/4.5] rounded-xl overflow-hidden bg-gray-900 shadow-inner relative">
            <img
              src={photo.url}
              alt={photo.caption || 'Memory Photo'}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Caption & Info (Matching 00:23 in video) */}
          <div className="w-full mt-4 text-center">
            <p className="font-script text-2xl sm:text-3xl text-gray-800 font-bold leading-tight">
              {photo.caption || 'A Beautiful Memory ❤️'}
            </p>

            {photo.date && (
              <div className="mt-1 flex items-center justify-center gap-1 text-xs text-pink-600 font-medium">
                <Calendar size={13} />
                <span>{photo.date}</span>
              </div>
            )}
            {photos.length > 1 && <p className="mt-2 text-xs font-semibold text-gray-500">{photoIndex + 1} / {photos.length}</p>}
          </div>

          {/* Download Button (Matching Reference Video 00:23) */}
          <div className="w-full mt-5">
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm sm:text-base font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

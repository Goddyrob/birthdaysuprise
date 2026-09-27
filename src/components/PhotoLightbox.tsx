import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoItem } from '../types';
import { useModalAccessibility } from '../utils/useModalAccessibility';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  onClose: () => void;
  photos?: PhotoItem[];
  photoIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photo, onClose, photos = [], photoIndex = 0, onPrevious, onNext }) => {
  const dialogRef = useModalAccessibility(Boolean(photo), onClose);
  const [imageFailure, setImageFailure] = useState<'primary' | 'fallback' | null>(null);

  useEffect(() => setImageFailure(null), [photo?.url]);

  useEffect(() => {
    if (!photo) return;
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') onPrevious?.();
      if (event.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [onNext, onPrevious, photo]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:p-4">
        {/* Click outside backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Polaroid Card Lightbox (Matching 00:23 in reference video) */}
        <motion.div
          ref={dialogRef}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 flex max-h-full w-full max-w-sm select-none flex-col items-center overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-white p-3 pb-4 shadow-2xl sm:max-w-md sm:p-6 sm:pb-8"
          role="dialog"
          aria-modal="true"
          aria-label="Memory photo details"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close photo"
            className="absolute right-2 top-2 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-xl transition-colors hover:bg-pink-50 hover:text-pink-600 sm:-right-4 sm:-top-4"
          >
            <X size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={onPrevious}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-xl hover:bg-pink-50 hover:text-pink-600 sm:left-3"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={onNext}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-xl hover:bg-pink-50 hover:text-pink-600 sm:right-3"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Photo container */}
          <div className="relative aspect-[4/4.5] max-h-[min(58dvh,520px)] w-full overflow-hidden rounded-xl bg-gray-900 shadow-inner">
            {imageFailure !== 'fallback' && (
              <img
                src={imageFailure === 'primary' ? '/default-surprise.svg' : photo.url}
                alt={photo.caption || 'Memory Photo'}
                width={800}
                height={900}
                decoding="async"
                onError={() => setImageFailure((previous) => previous ? 'fallback' : 'primary')}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Caption & Info (Matching 00:23 in video) */}
          <div className="mt-3 w-full text-center sm:mt-4">
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
          <div className="mt-3 w-full sm:mt-5">
            <button
              onClick={handleDownload}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-sky-700 hover:to-indigo-700 active:scale-98 sm:text-base"
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

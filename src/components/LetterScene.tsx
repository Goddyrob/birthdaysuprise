import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, ArrowRight, MailOpen, Edit3 } from 'lucide-react';
import { playEnvelopeOpenSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface LetterSceneProps {
  title: string;
  greeting: string;
  body: string[];
  closing: string;
  senderName: string;
  recipientName: string;
  onNext: () => void;
  onEditLetter?: () => void;
}

export const LetterScene: React.FC<LetterSceneProps> = ({
  title,
  greeting,
  body,
  closing,
  senderName,
  recipientName,
  onNext,
  onEditLetter,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenEnvelope = () => {
    if (isOpen) return;
    setIsOpen(true);
    playEnvelopeOpenSound();

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#fda4af', '#f43f5e', '#fef08a']
    });
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-start overflow-y-auto bg-gradient-to-br from-[#ffeef4] via-[#fde2e8] to-[#fcd5e2] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] select-none sm:justify-center sm:p-6 lg:p-8">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Wrapper */}
      <div className="relative z-10 my-auto flex w-full max-w-xl flex-col items-center py-3 sm:py-0">
        
        {/* Header before opened */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 text-center sm:mb-8"
          >
            <h1 className="font-serif text-2xl font-bold leading-tight text-gray-800 sm:text-4xl lg:text-5xl">
              A Letter, Just For You
            </h1>
            <p className="mt-2 text-sm sm:text-base text-pink-700/80 font-medium flex items-center justify-center gap-1.5">
              <span>Tap the envelope to open!</span>
              <Sparkles size={16} className="text-pink-500" />
            </p>
          </motion.div>
        )}

        {/* Envelope Interaction (When Unopened) */}
        {!isOpen && (
          <motion.div
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleOpenEnvelope}
            className="relative flex h-44 w-[min(18rem,calc(100vw-1.5rem))] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300 shadow-2xl transition-shadow hover:shadow-pink-300/60 sm:h-56 sm:w-[21rem]"
          >
            {/* Envelope Flap Triangles */}
            <div className="absolute inset-0">
              {/* Top Flap */}
              <div 
                className="absolute top-0 left-0 right-0 h-28 sm:h-32 bg-pink-300/90 border-b-2 border-white/80 shadow-md origin-top"
                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
              />
              {/* Bottom fold */}
              <div
                className="absolute bottom-0 left-0 right-0 h-28 sm:h-32 bg-pink-200/90 border-t-2 border-white/60"
                style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }}
              />
            </div>

            {/* Glowing Heart Wax Seal in Center */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg border-2 border-white flex items-center justify-center"
            >
              <Heart size={26} className="fill-white text-white filter drop-shadow-sm" />
            </motion.div>

            {/* Tap cue badge */}
            <div className="absolute bottom-3 z-20 text-[11px] font-semibold text-pink-900 bg-white/90 px-3 py-1 rounded-full shadow-sm">
              Click to Open
            </div>
          </motion.div>
        )}

        {/* OPENED MESSAGE CARD (Matching 00:12 - 00:15 in reference video) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white/95 p-4 shadow-[0_25px_70px_-15px_rgba(236,72,153,0.25)] backdrop-blur-xl sm:rounded-[2rem] sm:p-10"
            >
              {/* Romantic decorative corner floral accents */}
              <div className="absolute top-3 right-4 text-pink-300 text-lg">🌸</div>
              <div className="absolute top-3 left-4 text-pink-300 text-lg">🌸</div>

              {/* Card Header (Large typography) */}
              <div className="text-center pb-4 border-b border-pink-100/80">
                <h2 className="font-serif text-xl font-extrabold leading-tight text-gray-800 sm:text-3xl lg:text-4xl">
                  {title}
                </h2>
                <p className="font-script text-xl sm:text-2xl text-pink-600 mt-1">
                  {greeting}
                </p>
              </div>

              {/* Scrollable Letter Content */}
              <div className="my-4 max-h-[42dvh] space-y-3 overflow-y-auto overscroll-contain pr-2 text-left select-text custom-scrollbar sm:my-5 sm:max-h-[44vh] sm:space-y-3.5">
                {body.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="font-sans text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed font-normal"
                  >
                    {paragraph}
                  </p>
                ))}

                {/* Closing signature */}
                <div className="pt-3 pb-1 text-center">
                  <p className="font-script text-2xl sm:text-3xl text-pink-600 font-bold">
                    {closing}
                  </p>
                  <p className="font-hand text-lg sm:text-xl text-gray-600 mt-1">
                    ~ {senderName}
                  </p>
                </div>
              </div>

              {/* Action Buttons at Bottom of Card */}
              <div className="flex items-center justify-between gap-2 border-t border-pink-100/80 pt-3 sm:gap-4 sm:pt-4">
                {onEditLetter && (
                  <button
                    onClick={onEditLetter}
                    className="flex min-h-11 items-center gap-1.5 rounded-full bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600 transition-colors hover:bg-pink-100 hover:text-pink-800"
                  >
                    <Edit3 size={14} />
                    <span>Edit Letter</span>
                  </button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNext}
                  className="ml-auto flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 px-6 py-2.5 font-serif text-sm font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:shadow-pink-500/50 sm:px-8 sm:py-3 sm:text-lg"
                >
                  <span>Next</span>
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

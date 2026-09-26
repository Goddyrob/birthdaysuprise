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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#ffeef4] via-[#fde2e8] to-[#fcd5e2] select-none">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Wrapper */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        
        {/* Header before opened */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 tracking-tight">
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
            className="relative cursor-pointer w-72 sm:w-84 h-48 sm:h-56 bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300 rounded-2xl shadow-2xl border-2 border-white flex items-center justify-center overflow-hidden transition-shadow hover:shadow-pink-300/60"
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
              className="w-full bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_25px_70px_-15px_rgba(236,72,153,0.25)] border border-pink-100 p-6 sm:p-10 flex flex-col relative overflow-hidden"
            >
              {/* Romantic decorative corner floral accents */}
              <div className="absolute top-3 right-4 text-pink-300 text-lg">🌸</div>
              <div className="absolute top-3 left-4 text-pink-300 text-lg">🌸</div>

              {/* Card Header (Large typography) */}
              <div className="text-center pb-4 border-b border-pink-100/80">
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 tracking-tight">
                  {title}
                </h2>
                <p className="font-script text-xl sm:text-2xl text-pink-600 mt-1">
                  {greeting}
                </p>
              </div>

              {/* Scrollable Letter Content */}
              <div className="my-5 space-y-3.5 max-h-[38vh] sm:max-h-[44vh] overflow-y-auto pr-2 custom-scrollbar text-left select-text">
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
              <div className="pt-4 border-t border-pink-100/80 flex items-center justify-between gap-4">
                {onEditLetter && (
                  <button
                    onClick={onEditLetter}
                    className="px-4 py-2 text-xs font-semibold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Edit Letter</span>
                  </button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNext}
                  className="ml-auto px-8 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-serif text-base sm:text-lg font-bold rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 flex items-center gap-2 cursor-pointer transition-all"
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Sparkles, RefreshCw, Bookmark, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playKeySound, playPasscodeSuccessSound } from '../utils/audio';

interface LoveReasonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

const LOVE_REASONS = [
  "The way your eyes light up whenever you talk about things you love ✨",
  "How you make even the most ordinary day feel like a magical adventure 🌸",
  "Your warm, sweet smile that instantly melts away all my worries 💕",
  "The gentle way you hold my hand when we walk together 👫",
  "How you understand me even without speaking a single word 💖",
  "Your goofy laugh that is completely contagious and beautiful 😄",
  "The kindness, warmth, and pure love in your heart 🤍",
  "How safe and peaceful I feel whenever I am with you 🏡",
  "Your cute little habits and adorable expressions 🥺",
  "Because you are not just my love, you are my best friend and soulmate forever ❤️"
];

const LOVE_QUOTES = [
  "In a sea of people, my eyes will always search for you. 💕",
  "Every love story is beautiful, but ours is my absolute favorite. ✨",
  "I loved you yesterday, love you still, always have, always will. 💖",
  "You are my today and all of my tomorrows. 🌹",
  "To the world you may be one person, but to me you are the whole world. 🌍❤️",
  "I fell in love with the way you touched my soul without using your hands. ✨"
];

export const LoveReasonsModal: React.FC<LoveReasonsModalProps> = ({ isOpen, onClose, recipientName }) => {
  const [activeTab, setActiveTab] = useState<'reasons' | 'quotes' | 'meter'>('reasons');
  const [revealedReasons, setRevealedReasons] = useState<number[]>([0, 1, 2]);
  const [lovePercentage, setLovePercentage] = useState(100);
  const [loveMessage, setLoveMessage] = useState('Infinity & Beyond! 💖');

  const handleRevealNext = () => {
    playKeySound();
    if (revealedReasons.length < LOVE_REASONS.length) {
      const nextIdx = revealedReasons.length;
      setRevealedReasons([...revealedReasons, nextIdx]);
      if (nextIdx === LOVE_REASONS.length - 1) {
        playPasscodeSuccessSound();
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#f43f5e', '#fda4af', '#fcd34d']
        });
      }
    }
  };

  const calculateLove = () => {
    playKeySound();
    const percent = Math.floor(Math.random() * 5) + 100; // 100% to 104%
    setLovePercentage(percent);
    const messages = [
      'Infinite Love! You are my universe! 🌌💖',
      '1000% Soulmate Connection! ✨❤️',
      'True love that defies all numbers! ♾️💕',
      'Written in the stars forever! 🌟💖'
    ];
    setLoveMessage(messages[Math.floor(Math.random() * messages.length)]);
    playPasscodeSuccessSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f43f5e', '#fb7185']
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-pink-200 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-800">
                Reasons I love you
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-pink-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-pink-100 bg-pink-50/40 px-6 gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('reasons')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reasons'
                  ? 'border-pink-500 text-pink-600 bg-white/60 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-pink-500'
              }`}
            >
              <Gift size={15} />
              <span>Reasons ({revealedReasons.length}/{LOVE_REASONS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'quotes'
                  ? 'border-pink-500 text-pink-600 bg-white/60 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-pink-500'
              }`}
            >
              <Bookmark size={15} />
              <span>Sweet Quotes</span>
            </button>
            <button
              onClick={() => setActiveTab('meter')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'meter'
                  ? 'border-pink-500 text-pink-600 bg-white/60 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-pink-500'
              }`}
            >
              <Sparkles size={15} />
              <span>Love Meter</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
            {/* TAB 1: REASONS */}
            {activeTab === 'reasons' && (
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-pink-700/80 font-medium text-center mb-3">
                  Little things that make my heart beat only for you, {recipientName} 🌸
                </p>
                {revealedReasons.map((idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50/60 border border-pink-100 flex items-start gap-3 shadow-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      {LOVE_REASONS[idx]}
                    </p>
                  </motion.div>
                ))}

                {revealedReasons.length < LOVE_REASONS.length ? (
                  <div className="pt-2 text-center">
                    <button
                      onClick={handleRevealNext}
                      className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md shadow-pink-500/20 flex items-center gap-2 mx-auto cursor-pointer transition-all active:scale-95"
                    >
                      <Sparkles size={15} />
                      <span>Unlock next reason</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-pink-100/70 text-center text-xs font-bold text-pink-800 border border-pink-200 mt-3">
                    ❤️ And countless a million more reasons every single day! ❤️
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUOTES */}
            {activeTab === 'quotes' && (
              <div className="space-y-3">
                {LOVE_QUOTES.map((quote, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 text-center"
                  >
                    <p className="font-serif text-sm sm:text-base italic text-gray-800 leading-relaxed">
                      "{quote}"
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* TAB 3: LOVE METER */}
            {activeTab === 'meter' && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 flex flex-col items-center justify-center shadow-xl shadow-pink-500/30 text-white border-4 border-white"
                  >
                    <Heart size={32} className="fill-white text-white mb-1 animate-pulse" />
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {lovePercentage}%
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                      Love Match
                    </span>
                  </motion.div>
                </div>

                <div className="max-w-xs">
                  <p className="font-script text-2xl text-pink-600 font-bold">
                    {loveMessage}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Tested between You & {recipientName} ❤️
                  </p>
                </div>

                <button
                  onClick={calculateLove}
                  className="px-6 py-2.5 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs sm:text-sm font-semibold rounded-full border border-pink-300 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Test again</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-pink-100 bg-pink-50/40 text-center">
            <p className="font-script text-lg text-pink-600 font-semibold">
              Forever and always with you ❤️
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

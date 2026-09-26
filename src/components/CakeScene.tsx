import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCakeSliceSound } from '../utils/audio';

interface CakeSceneProps {
  heading: string;
  celebrationText: string;
  onNext: () => void;
}

export const CakeScene: React.FC<CakeSceneProps> = ({
  heading,
  celebrationText,
  onNext,
}) => {
  const [isCut, setIsCut] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliceProgress, setSliceProgress] = useState(0);
  const [knifePosition, setKnifePosition] = useState<{ x: number; y: number } | null>(null);
  
  const cakeAreaRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCut) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    updateKnife(e);
  };

  const updateKnife = (e: React.PointerEvent) => {
    if (!cakeAreaRef.current) return;
    const rect = cakeAreaRef.current.getBoundingClientRect();
    setKnifePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isCut || startXRef.current === null) return;
    updateKnife(e);

    const deltaX = Math.abs(e.clientX - startXRef.current);
    const progress = Math.min(100, Math.round((deltaX / 180) * 100));
    setSliceProgress(progress);

    if (progress >= 80) {
      triggerCutSuccess();
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setKnifePosition(null);
    startXRef.current = null;
  };

  const triggerCutSuccess = () => {
    if (isCut) return;
    setIsCut(true);
    setIsDragging(false);
    setKnifePosition(null);
    playCakeSliceSound();

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#ec4899', '#f43f5e', '#fb7185', '#fcd34d', '#a78bfa']
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#ffeef4] via-[#fde2e8] to-[#fcd5e2] select-none">
      
      {/* Background Soft Floating Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
        
        {/* Title (Large typography) */}
        <motion.h1
          key={isCut ? 'cut-title' : 'uncut-title'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-tight mb-2"
        >
          {isCut ? celebrationText : heading}
        </motion.h1>

        {/* Subtitle instructions */}
        <p className="text-sm sm:text-base text-pink-700/80 font-medium mb-6">
          {isCut ? 'Make a sweet wish! 🎂✨' : 'Drag your finger or mouse across the cake to slice'}
        </p>

        {/* Interactive Cake Area */}
        <div
          ref={cakeAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => {
            if (!isCut) triggerCutSuccess();
          }}
          className={`relative w-72 sm:w-88 h-72 sm:h-88 flex items-center justify-center cursor-pointer transition-transform ${
            !isCut ? 'hover:scale-[1.02] active:scale-[0.99]' : ''
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Knife Cursor Trail during dragging */}
          {isDragging && knifePosition && (
            <div
              className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-1/2 transition-transform"
              style={{ left: knifePosition.x, top: knifePosition.y }}
            >
              <div className="text-3xl filter drop-shadow-md">🔪</div>
              {/* Glowing slice trail */}
              <div className="w-1.5 h-16 bg-gradient-to-b from-amber-300 via-pink-400 to-transparent blur-[1px] rounded-full mx-auto -mt-2 opacity-80" />
            </div>
          )}

          {/* Sliced Cake Left & Right halves or Uncut Cake */}
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* ILLUSTRATED PINK BIRTHDAY CAKE */}
            <div className="relative w-64 sm:w-76 flex flex-col items-center">
              
              {/* Candles on top */}
              <div className="flex items-center justify-center gap-6 mb-1 z-20">
                {[1, 2, 3].map((candle) => (
                  <div key={candle} className="flex flex-col items-center">
                    {/* Flame */}
                    <AnimatePresence>
                      {!isCut ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [1, 1.2, 0.95, 1.1] }}
                          exit={{ opacity: 0, scale: 0, y: -10 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-3.5 h-5 bg-gradient-to-t from-amber-500 via-amber-300 to-yellow-100 rounded-full blur-[0.5px] shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-flame"
                        />
                      ) : (
                        <motion.div
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -20, scale: 1.5 }}
                          className="text-xs text-gray-400 select-none"
                        >
                          💨
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Candle Stick */}
                    <div className="w-2.5 h-8 bg-gradient-to-b from-pink-300 via-white to-pink-200 rounded-t-sm shadow-sm border border-pink-300/40 -mt-0.5" />
                  </div>
                ))}
              </div>

              {/* Cake Layers Wrapper */}
              <div className="relative w-full flex items-center justify-center">
                
                {/* Left Half (when sliced) */}
                <motion.div
                  animate={isCut ? { x: -16, rotate: -2 } : { x: 0, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 120 }}
                  className="w-1/2 overflow-hidden flex flex-col items-end"
                >
                  {/* Top Layer */}
                  <div className="w-24 sm:w-28 h-12 bg-gradient-to-b from-pink-200 via-pink-300 to-pink-400 rounded-tl-2xl shadow-sm relative border-l-2 border-t-2 border-white/60">
                    <div className="absolute top-1 right-2 text-sm">🍓</div>
                    {/* White Frosting Drips */}
                    <div className="absolute -bottom-1 left-0 right-0 h-3 bg-white/90 rounded-b-xl" />
                  </div>
                  {/* Middle Cream */}
                  <div className="w-28 sm:w-32 h-3 bg-white shadow-xs" />
                  {/* Bottom Layer */}
                  <div className="w-32 sm:w-36 h-18 bg-gradient-to-b from-rose-200 via-rose-300 to-pink-400 rounded-bl-3xl shadow-md relative border-l-2 border-b-2 border-white/60">
                    <div className="absolute top-2 right-4 text-sm">🍓</div>
                    <div className="absolute bottom-2 left-3 text-xs">✨</div>
                  </div>
                </motion.div>

                {/* Sliced line divider */}
                {isCut && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-1 h-32 bg-amber-300/80 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-30"
                  />
                )}

                {/* Right Half (when sliced) */}
                <motion.div
                  animate={isCut ? { x: 16, rotate: 2 } : { x: 0, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 120 }}
                  className="w-1/2 overflow-hidden flex flex-col items-start"
                >
                  {/* Top Layer */}
                  <div className="w-24 sm:w-28 h-12 bg-gradient-to-b from-pink-200 via-pink-300 to-pink-400 rounded-tr-2xl shadow-sm relative border-r-2 border-t-2 border-white/60">
                    <div className="absolute top-1 left-2 text-sm">🍓</div>
                    {/* White Frosting Drips */}
                    <div className="absolute -bottom-1 left-0 right-0 h-3 bg-white/90 rounded-b-xl" />
                  </div>
                  {/* Middle Cream */}
                  <div className="w-28 sm:w-32 h-3 bg-white shadow-xs" />
                  {/* Bottom Layer */}
                  <div className="w-32 sm:w-36 h-18 bg-gradient-to-b from-rose-200 via-rose-300 to-pink-400 rounded-br-3xl shadow-md relative border-r-2 border-b-2 border-white/60">
                    <div className="absolute top-2 left-4 text-sm">🍓</div>
                    <div className="absolute bottom-2 right-3 text-xs">✨</div>
                  </div>
                </motion.div>

              </div>

              {/* Cake Plate Stand */}
              <div className="w-68 sm:w-78 h-4 bg-gradient-to-r from-gray-200 via-white to-gray-200 rounded-full shadow-lg border border-gray-300/50 mt-1" />
            </div>

          </div>

          {/* Swipe indicator guide when uncut */}
          {!isCut && (
            <motion.div
              animate={{ x: [-40, 40, -40] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-2 pointer-events-none flex items-center gap-1 text-xs font-semibold text-pink-600 bg-white/90 px-3 py-1 rounded-full shadow-md border border-pink-200"
            >
              <span>Swipe to slice</span>
            </motion.div>
          )}
        </div>

        {/* Next Scene Button (Appears when sliced, matching reference video 00:10) */}
        <div className="mt-8 h-14">
          <AnimatePresence>
            {isCut && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNext}
                className="px-8 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-serif text-lg sm:text-xl font-bold rounded-full shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 border border-pink-300/60 flex items-center gap-2 cursor-pointer transition-all animate-pulse-slow"
              >
                <span>Next Scene</span>
                <ArrowRight size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

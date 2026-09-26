import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { playPullCordSound, playLampIgniteSound } from '../utils/audio';

interface LampSceneProps {
  onComplete: () => void;
}

export const LampScene: React.FC<LampSceneProps> = ({ onComplete }) => {
  const [isPulled, setIsPulled] = useState(false);
  const [isLit, setIsLit] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const dragY = useMotionValue(0);
  const cordHeight = useTransform(dragY, [0, 100], [90, 190]);

  const handlePullTrigger = () => {
    if (isPulled || isTransitioning) return;
    setIsPulled(true);
    playPullCordSound();

    setTimeout(() => {
      setIsLit(true);
      playLampIgniteSound();

      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          onComplete();
        }, 1100);
      }, 1000);
    }, 350);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 overflow-hidden bg-gradient-to-b from-[#ffeef4] via-[#fde2e8] to-[#fcd5e2] select-none">
      
      {/* Background Glow when lit */}
      <motion.div
        animate={isLit ? { opacity: [0, 0.85, 0.6], scale: [0.8, 1.8, 1.5] } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 bg-radial from-amber-200/50 via-rose-300/30 to-transparent pointer-events-none"
      />

      {/* Ceiling Wire & Hanging Cute Lamp */}
      <div className="w-full flex flex-col items-center relative z-20 pt-2">
        {/* Top Wire */}
        <div className="w-0.5 h-16 sm:h-24 bg-gray-400/80 shadow-sm" />

        {/* Lamp Fixture & Smiling Glowing Bulb Character */}
        <motion.div
          animate={
            isLit
              ? {
                  scale: [1, 1.15, 1.08],
                  filter: ['drop-shadow(0 0 10px rgba(251,191,36,0.3))', 'drop-shadow(0 0 45px rgba(251,191,36,0.9))', 'drop-shadow(0 0 30px rgba(251,191,36,0.7))'],
                }
              : { y: [0, 4, 0] }
          }
          transition={isLit ? { duration: 0.8 } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex flex-col items-center cursor-pointer"
          onClick={handlePullTrigger}
        >
          {/* Metal Socket Cap */}
          <div className="w-8 h-4 bg-gradient-to-b from-gray-400 to-gray-500 rounded-t-md shadow-md border-b border-gray-600" />

          {/* Cute Round Bulb Body */}
          <div
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center relative transition-all duration-700 shadow-xl ${
              isLit
                ? 'bg-gradient-to-br from-amber-100 via-amber-200 to-rose-200 border-2 border-amber-300 ring-8 ring-amber-300/30'
                : 'bg-gradient-to-br from-pink-50 via-rose-100 to-pink-200 border-2 border-pink-200'
            }`}
          >
            {/* Cute Kawaii Face (Smiling Eyes & Pink Cheeks) */}
            <div className="flex items-center justify-center gap-5 sm:gap-6 mt-1">
              {/* Left Eye */}
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full -mt-1 -mr-1" />
              </div>
              {/* Right Eye */}
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full -mt-1 -mr-1" />
              </div>
            </div>

            {/* Cute Blush Cheeks */}
            <div className="flex items-center justify-between w-20 sm:w-24 px-1 mt-0.5">
              <div className="w-3.5 h-2 bg-pink-400/60 rounded-full blur-[0.5px]" />
              {/* Smile Mouth */}
              <div className="w-3.5 h-2 border-b-2 border-gray-700 rounded-full" />
              <div className="w-3.5 h-2 bg-pink-400/60 rounded-full blur-[0.5px]" />
            </div>

            {/* Glowing Sparkles when Lit */}
            {isLit && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1.2], opacity: [0, 1, 0.9] }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="text-4xl animate-flame">🔥</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* PULL STRING INTERACTION (Matching Reference Video) */}
        <div className="relative flex flex-col items-center mt-0">
          <motion.div
            style={{ height: cordHeight }}
            className="w-0.5 bg-gray-400 flex flex-col items-center justify-end"
          >
            {/* Pull Cord Handle / Heart Knob */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 100 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                if (info.offset.y > 35) {
                  handlePullTrigger();
                }
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePullTrigger}
              className={`cursor-grab active:cursor-grabbing p-2.5 rounded-full shadow-lg border transition-all ${
                isPulled
                  ? 'bg-amber-400 border-amber-300 text-white'
                  : 'bg-white hover:bg-pink-50 border-pink-300 text-pink-500'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-[10px] text-white">
                ▼
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Instruction Subtitle (Large, clear romantic typography) */}
      <div className="relative z-20 text-center pb-12 sm:pb-16 max-w-md mx-auto">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-pink-200"
        >
          <Sparkles className="w-5 h-5 text-pink-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-serif text-lg sm:text-xl font-semibold text-gray-800">
            {isLit ? 'Lighting up your special day...' : 'Pull the string to turn on the light'}
          </span>
        </motion.div>

        <p className="mt-3 text-sm text-pink-700/70 font-medium">
          Drag down or tap the cord handle
        </p>
      </div>

      {/* Flame Burst & Transition Screen (00:07 - 00:08 in reference video) */}
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.5 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-amber-100 via-rose-200 to-pink-300 flex items-center justify-center pointer-events-none"
        >
          <div className="text-8xl sm:text-9xl animate-flame">🔥</div>
        </motion.div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Repeat, Camera, Sparkles, Settings, KeyRound, Gift } from 'lucide-react';
import { playKeySound, playPasscodeSuccessSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { AppConfig, ShareResult } from '../types';

const defaultSurpriseImage = '/default-surprise.svg';

interface LandingSceneProps {
  mainPhoto: string;
  polaroidText: string;
  passcode: string;
  recipientName: string;
  onSuccess: () => void;
  onUpdateMainPhoto: (url: string) => void;
  onOpenSettings: () => void;
  onOpenNotes: () => void;
  onOpenLoveReasons: () => void;
  onShare: (config?: AppConfig) => Promise<ShareResult>;
  passcodeLength?: number;
  onUnlock?: (passcode: string) => Promise<boolean>;
  isLocked?: boolean;
  isRecipientMode?: boolean;
}

export const LandingScene: React.FC<LandingSceneProps> = ({
  mainPhoto,
  polaroidText,
  passcode,
  recipientName,
  onSuccess,
  onUpdateMainPhoto,
  onOpenSettings,
  onOpenNotes,
  onOpenLoveReasons,
  onShare,
  passcodeLength,
  onUnlock,
  isLocked = false,
  isRecipientMode = false,
}) => {
  const [enteredDigits, setEnteredDigits] = useState<string[]>([]);
  const [likesCount, setLikesCount] = useState(999);
  const [hasLiked, setHasLiked] = useState(false);
  const [sharesCount, setSharesCount] = useState(5);
  const [errorShake, setErrorShake] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [mainPhotoLoaded, setMainPhotoLoaded] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [imageFailed, setImageFailed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageFailed(false);
    setMainPhotoLoaded(false);
  }, [mainPhoto]);

  useEffect(() => {
    if (!pendingSuccess || (onUnlock && mainPhoto && !mainPhotoLoaded)) return;
    const timer = window.setTimeout(() => {
      setPendingSuccess(false);
      onSuccess();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [mainPhoto, mainPhotoLoaded, onSuccess, onUnlock, pendingSuccess]);

  const expectedLength = passcodeLength || passcode.length || 4;

  const handleDigitPress = (digit: string) => {
    playKeySound();

    if (digit === 'del' || digit === '10' || digit === '*') {
      setEnteredDigits((prev) => prev.slice(0, -1));
      return;
    }

    if (enteredDigits.length >= expectedLength) return;

    const next = [...enteredDigits, digit];
    setEnteredDigits(next);
    setUnlockError('');

    if (next.length === expectedLength) {
      const code = next.join('');
      const unlock = async () => {
        const isValid = onUnlock ? await onUnlock(code) : code === passcode || passcode === '';
        if (isValid) {
          playPasscodeSuccessSound();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ec4899', '#f43f5e', '#fda4af', '#fcd34d']
          });
          setPendingSuccess(true);
          return;
        }

        setUnlockError('That passcode is not correct. Please try again.');
        setErrorShake(true);
        setTimeout(() => {
          setErrorShake(false);
          setEnteredDigits([]);
        }, 600);
      };

      void unlock().catch(() => {
        setUnlockError('This surprise could not be unlocked right now. Please try again.');
        setEnteredDigits([]);
      });
      return;
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    setLikesCount((prev) => prev + 1);
    setHasLiked(true);
    playKeySound();

    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top
    };
    setFloatingHearts((prev) => [...prev, newHeart]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1500);
  };

  const handleShareClick = async () => {
    setSharesCount((prev) => prev + 1);
    playKeySound();
    try {
      await onShare();
    } catch (e) {
      // noop
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onUpdateMainPhoto(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#ffeef4] via-[#fde2e8] to-[#fcd5e2]">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass/Pastel Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-5xl rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] p-6 sm:p-10 lg:p-14"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SIDE: Large Polaroid Photo with Pink Ribbon */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <motion.div
              whileHover={{ rotate: 1, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative group w-full max-w-[340px] sm:max-w-[380px] bg-white p-4 pb-7 rounded-2xl shadow-2xl border border-pink-100/80 transform -rotate-1.5 transition-transform"
            >
              {/* Decorative Pink Ribbon/Bow graphic top-left (Matching Reference Video) */}
              <div className="absolute -top-4 -left-4 z-20 w-16 h-16 pointer-events-none drop-shadow-md select-none">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Left Loop */}
                  <path d="M50 45 C30 15, 10 30, 25 50 C35 60, 48 48, 50 45 Z" fill="#f472b6" />
                  <path d="M48 44 C32 22, 18 34, 28 48 C36 54, 46 47, 48 44 Z" fill="#ec4899" opacity="0.4" />
                  {/* Right Loop */}
                  <path d="M50 45 C70 15, 90 30, 75 50 C65 60, 52 48, 50 45 Z" fill="#f472b6" />
                  <path d="M52 44 C68 22, 82 34, 72 48 C64 54, 54 47, 52 44 Z" fill="#ec4899" opacity="0.4" />
                  {/* Left Ribbon Tail */}
                  <path d="M46 50 Q30 75 18 85 Q28 80 38 88 Q44 65 48 52 Z" fill="#fb7185" />
                  {/* Right Ribbon Tail */}
                  <path d="M54 50 Q70 75 82 85 Q72 80 62 88 Q56 65 52 52 Z" fill="#fb7185" />
                  {/* Center Knot */}
                  <ellipse cx="50" cy="46" rx="8" ry="7" fill="#db2777" />
                  <ellipse cx="49" cy="45" rx="5" ry="4" fill="#f472b6" />
                </svg>
              </div>

              {/* Polaroid Image Area */}
              <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-lg bg-pink-50 shadow-inner">
                {isLocked && !mainPhoto ? (
                  <div className="h-full w-full bg-gradient-to-br from-pink-200 via-rose-100 to-amber-100" aria-label="Locked surprise" />
                ) : mainPhoto && !imageFailed ? (
                  <img
                    src={mainPhoto}
                    alt="Birthday Memory"
                    onLoad={() => setMainPhotoLoaded(true)}
                    onError={() => {
                      setImageFailed(true);
                      setMainPhotoLoaded(true);
                    }}
                    className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img src={defaultSurpriseImage} alt="A romantic birthday memory" className="h-full w-full object-cover" />
                )}

                {/* Upload Button Overlay */}
                {!isRecipientMode && !isLocked && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 font-medium cursor-pointer"
                    title="Click to change photo"
                  >
                    <div className="p-3 bg-pink-500/80 rounded-full text-white shadow-lg">
                      <Camera size={24} />
                    </div>
                    <span className="text-sm font-semibold tracking-wide bg-black/50 px-3 py-1 rounded-full">
                      Change Photo
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Polaroid Handwritten Caption */}
              <div className="mt-4 text-center">
                <p className="font-script text-2xl sm:text-3xl text-gray-800 tracking-wide">
                  {polaroidText}
                </p>
              </div>
            </motion.div>

            {/* Mobile-only quick photo upload hint */}
            {!isRecipientMode && !isLocked && <div className="mt-3 block sm:hidden">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-pink-600 flex items-center gap-1 bg-pink-100/80 px-3 py-1.5 rounded-full"
              >
                <Camera size={14} /> Tap to upload your photo
              </button>
            </div>}
          </div>

          {/* CENTER-RIGHT SIDE: Large Passcode Input & Keypad */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            {/* Heading (Large typography matching instructions) */}
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 tracking-tight"
            >
              Enter Passcode
            </motion.h1>

            {/* Passcode Digits / Heart Bullets */}
            <motion.div
              animate={errorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="my-5 sm:my-6 flex items-center justify-center gap-3 sm:gap-4"
            >
              {Array.from({ length: expectedLength }).map((_, idx) => {
                const isFilled = idx < enteredDigits.length;
                return (
                  <div
                    key={idx}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                      isFilled
                        ? 'bg-gradient-to-br from-pink-400 to-rose-500 border-pink-400 text-white shadow-md shadow-pink-400/30 scale-105'
                        : 'bg-white/80 border-pink-200 text-pink-300'
                    }`}
                  >
                    {isFilled ? (
                      <Heart size={20} className="fill-current text-white animate-pulse" />
                    ) : (
                      <span className="text-pink-300 font-bold text-lg">•</span>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* Circular Keypad (1 - 10, *, 0) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-[280px] sm:max-w-[320px] w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '10'].map((val) => {
                const isBack = val === '*' || val === '10';
                const label = val === '10' ? '⌫' : val === '*' ? '♥' : val;
                
                return (
                  <motion.button
                    key={val}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleDigitPress(val === '10' ? 'del' : val)}
                    className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-full bg-white/90 hover:bg-white text-gray-800 hover:text-pink-600 font-sans text-xl sm:text-2xl font-bold shadow-md hover:shadow-lg border border-pink-100/90 flex items-center justify-center transition-colors cursor-pointer select-none"
                  >
                    {isBack && val === '10' ? (
                      <span className="text-base sm:text-lg text-pink-500">⌫</span>
                    ) : isBack && val === '*' ? (
                      <Heart size={18} className="text-pink-400 fill-pink-400" />
                    ) : (
                      label
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Passcode helper / Instant unlock for testing */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="text-xs text-pink-700/70 font-medium bg-pink-100/60 px-3 py-1 rounded-full">
                {onUnlock ? 'Enter your private passcode' : `Hint: ${passcode || '1234'}`}
              </span>
              {!onUnlock && (
                <button
                  onClick={() => {
                    playPasscodeSuccessSound();
                    onSuccess();
                  }}
                  className="text-xs text-pink-600 hover:text-pink-800 font-semibold underline flex items-center gap-1"
                  title="Bypass passcode"
                >
                  <KeyRound size={12} /> Unlock Directly
                </button>
              )}
            </div>
            {unlockError && <p className="mt-3 text-sm font-medium text-rose-600" role="alert">{unlockError}</p>}
          </div>

          {/* RIGHT RAIL: TikTok / Instagram Style Interactive Action Bar (Matching Reference Video) */}
          {!isRecipientMode && !isLocked && <div className="lg:col-span-1 flex flex-row lg:flex-col items-center justify-center gap-6 lg:gap-8 lg:border-l lg:border-pink-200/60 lg:pl-6">
            
            {/* Heart Likes Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileTap={{ scale: 1.25 }}
                onClick={handleLikeClick}
                className="p-3 rounded-full bg-white/90 shadow-lg text-pink-500 hover:bg-pink-50 transition-colors border border-pink-100 cursor-pointer"
                title="Give love"
              >
                <Heart
                  size={24}
                  className={`transition-colors ${hasLiked ? 'fill-pink-500 text-pink-500' : 'text-pink-400'}`}
                />
              </motion.button>
              <span className="mt-1 text-xs font-semibold text-gray-700">
                {likesCount}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Likes</span>
            </div>

            {/* Love Reasons / Sweet Quotes Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onOpenLoveReasons}
                className="p-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 shadow-lg text-white hover:from-pink-600 hover:to-rose-600 transition-all border border-pink-300 cursor-pointer"
                title="Why I Love You"
              >
                <Gift size={22} className="text-white" />
              </motion.button>
              <span className="mt-1 text-xs font-bold text-pink-600">Love</span>
              <span className="text-[10px] text-pink-500 uppercase tracking-wider font-medium">Reasons</span>
            </div>

            {/* Comments / Love Notes Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onOpenNotes}
                className="p-3 rounded-full bg-white/90 shadow-lg text-pink-500 hover:bg-pink-50 transition-colors border border-pink-100"
                title="Read sweet wishes"
              >
                <MessageCircle size={24} className="text-pink-500" />
              </motion.button>
              <span className="mt-1 text-xs font-semibold text-gray-700">103</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Notes</span>
            </div>

            {/* Share / Loop Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleShareClick}
                className="p-3 rounded-full bg-white/90 shadow-lg text-pink-500 hover:bg-pink-50 transition-colors border border-pink-100"
                title="Share link"
              >
                <Repeat size={24} className="text-pink-500" />
              </motion.button>
              <span className="mt-1 text-xs font-semibold text-gray-700">{sharesCount}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Share</span>
            </div>

            {/* Customization Settings Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onOpenSettings}
                className="p-3 rounded-full bg-pink-100/80 shadow-md text-pink-600 hover:bg-pink-200 transition-colors border border-pink-200"
                title="Customize photos, messages & sound"
              >
                <Settings size={22} />
              </motion.button>
              <span className="text-[10px] text-pink-600 uppercase tracking-wider font-medium mt-1">Edit</span>
            </div>

          </div>}

        </div>
      </motion.div>

      {/* Floating Clicked Hearts */}
      {floatingHearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0.8, y: 0 }}
          animate={{ opacity: 0, scale: 1.6, y: -100 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ left: h.x, top: h.y }}
          className="fixed pointer-events-none z-50 text-2xl"
        >
          💖
        </motion.div>
      ))}
    </div>
  );
};

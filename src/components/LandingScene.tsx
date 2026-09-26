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
    <div className="relative flex min-h-[100dvh] w-full items-start justify-center overflow-y-auto bg-gradient-to-br from-[#ffeef4] via-[#fde2e8] to-[#fcd5e2] px-3 pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.75rem))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 lg:items-center lg:p-8">
      {/* Background Soft Glow Orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 hidden h-96 w-96 rounded-full bg-pink-300/30 blur-3xl sm:block" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 hidden h-96 w-96 rounded-full bg-rose-200/40 blur-3xl sm:block" />

      {/* Main Glass/Pastel Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 my-auto w-full max-w-5xl rounded-[1.5rem] border border-white/80 bg-white/75 p-2 shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] backdrop-blur-xl min-[360px]:p-3 sm:rounded-[2.5rem] sm:p-8 lg:p-14"
      >
        <div className="grid grid-cols-1 items-center gap-2 max-[359px]:grid-cols-[minmax(0,0.95fr)_minmax(8.5rem,1.05fr)] min-[360px]:grid-cols-2 min-[360px]:gap-3 sm:gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* LEFT SIDE: Large Polaroid Photo with Pink Ribbon */}
          <div className="col-span-1 flex flex-col items-center justify-center min-[360px]:col-span-1 lg:col-span-6">
            <motion.div
              whileHover={{ rotate: 1, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="group relative w-full max-w-[340px] rotate-[-1.5deg] rounded-xl border border-pink-100/80 bg-white p-2 pb-3 shadow-xl transition-transform max-[359px]:max-w-none max-[359px]:p-1.5 max-[359px]:pb-2 sm:max-w-[380px] sm:rounded-2xl sm:p-4 sm:pb-7 sm:shadow-2xl"
            >
              {/* Decorative Pink Ribbon/Bow graphic top-left (Matching Reference Video) */}
              <div className="pointer-events-none absolute -left-2 -top-2 z-20 h-10 w-10 select-none drop-shadow-md sm:-left-4 sm:-top-4 sm:h-16 sm:w-16">
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
              <div className="mt-2 text-center sm:mt-4">
                <p className="font-script text-lg leading-tight text-gray-800 sm:text-3xl sm:tracking-wide">
                  {polaroidText}
                </p>
              </div>
            </motion.div>

            {/* Mobile-only quick photo upload hint */}
            {!isRecipientMode && !isLocked && <div className="mt-2 block sm:hidden">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-pink-600 flex items-center gap-1 bg-pink-100/80 px-3 py-1.5 rounded-full"
              >
                <Camera size={14} /> Tap to upload your photo
              </button>
            </div>}
          </div>

          {/* CENTER-RIGHT SIDE: Large Passcode Input & Keypad */}
          <div className="col-span-1 flex flex-col items-center text-center min-[360px]:col-span-1 lg:col-span-5">
            {/* Heading (Large typography matching instructions) */}
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-xl font-bold leading-tight text-gray-800 sm:text-4xl lg:text-5xl"
            >
              Enter Passcode
            </motion.h1>

            {/* Passcode Digits / Heart Bullets */}
            <motion.div
              animate={errorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="my-2.5 flex w-full max-w-[248px] items-center justify-center gap-1.5 sm:my-6 sm:gap-4"
            >
              {Array.from({ length: expectedLength }).map((_, idx) => {
                const isFilled = idx < enteredDigits.length;
                return (
                  <div
                    key={idx}
                    className={`aspect-square w-full max-w-10 rounded-xl border flex items-center justify-center transition-all duration-300 sm:h-12 sm:w-12 sm:max-w-none sm:rounded-2xl ${
                      isFilled
                        ? 'bg-gradient-to-br from-pink-400 to-rose-500 border-pink-400 text-white shadow-md shadow-pink-400/30 scale-105'
                        : 'bg-white/80 border-pink-200 text-pink-300'
                    }`}
                  >
                    {isFilled ? (
                      <Heart size={20} className="h-4 w-4 fill-current text-white sm:h-5 sm:w-5" />
                    ) : (
                      <span className="text-pink-300 font-bold text-lg">•</span>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* Circular Keypad (1 - 10, *, 0) */}
            <div className="grid w-full max-w-[220px] grid-cols-3 gap-1.5 max-[359px]:gap-0.5 sm:max-w-[320px] sm:gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '10'].map((val) => {
                const isBack = val === '*' || val === '10';
                const label = val === '10' ? '⌫' : val === '*' ? '♥' : val;
                
                return (
                  <motion.button
                    key={val}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleDigitPress(val === '10' ? 'del' : val)}
                    className="mx-auto flex h-11 w-11 select-none items-center justify-center rounded-full border border-pink-100/90 bg-white/90 font-sans text-lg font-bold text-gray-800 shadow-md transition-colors hover:bg-white hover:text-pink-600 active:scale-95 sm:h-[72px] sm:w-[72px] sm:text-2xl"
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
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-3">
              <span className="rounded-full bg-pink-100/60 px-2 py-1 text-[10px] font-medium text-pink-700/70 sm:px-3 sm:text-xs">
                {onUnlock ? 'Enter your private passcode' : `Hint: ${passcode || '1234'}`}
              </span>
              {!onUnlock && (
                <button
                  onClick={() => {
                    playPasscodeSuccessSound();
                    onSuccess();
                  }}
                  className="flex min-h-10 items-center gap-1 px-1 text-[11px] font-semibold text-pink-600 underline hover:text-pink-800 sm:text-xs"
                  title="Bypass passcode"
                >
                  <KeyRound size={12} /> Unlock Directly
                </button>
              )}
            </div>
            {unlockError && <p className="mt-2 text-xs font-medium text-rose-600 sm:mt-3 sm:text-sm" role="alert">{unlockError}</p>}
          </div>

          {/* RIGHT RAIL: TikTok / Instagram Style Interactive Action Bar (Matching Reference Video) */}
          {!isRecipientMode && !isLocked && <div className="col-span-full flex w-full flex-row items-center justify-around gap-1 border-t border-pink-200/60 pt-2 lg:col-span-1 lg:flex-col lg:gap-8 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-6">
            
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

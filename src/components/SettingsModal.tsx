import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Trash2,
  Plus,
  RefreshCw,
  Music,
  Heart,
  Image as ImageIcon,
  Key,
  Mail,
  Cake,
  Check,
  RotateCcw,
} from 'lucide-react';
import { AppConfig, PhotoItem, ShareResult } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  config: AppConfig;
  onClose: () => void;
  onSave: (newConfig: AppConfig) => void;
  onResetDefaults: () => void;
  onClearPhotos: () => void;
  onReplay: () => void;
  onShareCurrentConfig?: (config?: AppConfig) => Promise<ShareResult>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
  onResetDefaults,
  onClearPhotos,
  onReplay,
  onShareCurrentConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'text' | 'letter' | 'audio'>('photos');
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [savedBadge, setSavedBadge] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryPhotosInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setTempConfig(config);
    }
  }, [isOpen, config]);

  const handleMainPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setTempConfig((prev) => ({
            ...prev,
            mainPhoto: ev.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      (Array.from(files) as File[]).forEach((file: File, i: number) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            const newPhoto: PhotoItem = {
              id: `custom-${Date.now()}-${i}`,
              url: ev.target!.result as string,
              caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Special Memory ❤️',
              date: 'Cherished Moment',
              rotation: (Math.random() * 14) - 7,
              x: Math.floor(Math.random() * 70) + 15,
              y: Math.floor(Math.random() * 60) + 20,
              z: Math.floor(Math.random() * 80) - 20,
              scale: 1,
            };
            setTempConfig((prev) => ({
              ...prev,
              galleryPhotos: [...prev.galleryPhotos, newPhoto],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setTempConfig((prev) => ({
            ...prev,
            customAudioUrl: ev.target!.result as string,
            musicTitle: file.name.replace(/\.[^/.]+$/, ''),
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveGalleryPhoto = (id: string) => {
    setTempConfig((prev) => ({
      ...prev,
      galleryPhotos: prev.galleryPhotos.filter((p) => p.id !== id),
    }));
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    setTempConfig((prev) => ({
      ...prev,
      galleryPhotos: prev.galleryPhotos.map((p) => (p.id === id ? { ...p, caption } : p)),
    }));
  };

  const handleSave = () => {
    onSave(tempConfig);
    setSavedBadge(true);
    setTimeout(() => {
      setSavedBadge(false);
      onClose();
    }, 600);
  };

  const handleShare = async () => {
    if (!onShareCurrentConfig || isSharing) return;
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setShareError('');
      } catch {
        setShareCopied(false);
        setShareError('Clipboard access is unavailable. Select the link above to copy it manually.');
      }
      return;
    }
    setShareError('');
    setShareUrl('');
    setShareCopied(false);
    setIsSharing(true);
    try {
      const result = await onShareCurrentConfig(tempConfig);
      onSave(tempConfig);
      setShareUrl(result.url);
      setShareCopied(result.copied);
    } catch (error) {
      if (error instanceof Error && error.name === 'MediaUploadError') {
        setShareError('Your image could not be uploaded. Please choose it again and retry.');
      } else {
        setShareError('Your surprise could not be created. Please retry.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 backdrop-blur-sm select-none sm:items-center sm:p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-pink-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:border"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-800">
                Customize experience
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close customization"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-pink-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-pink-100 bg-pink-50/40 px-3 sm:gap-4 sm:px-6">
            {[
              { id: 'photos', label: 'Photos', icon: ImageIcon },
              { id: 'text', label: 'Names & Passcode', icon: Key },
              { id: 'letter', label: 'Love Letter', icon: Mail },
              { id: 'audio', label: 'Music', icon: Music },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2.5 text-xs font-semibold transition-all sm:px-4 sm:py-3 sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 bg-white/60 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-pink-500'
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div
            onFocusCapture={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLElement) || !target.matches('input, textarea')) return;
              window.setTimeout(() => target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 250);
            }}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 text-left [scroll-padding-bottom:1rem] select-text custom-scrollbar sm:space-y-6 sm:p-6"
          >
            {onShareCurrentConfig && (
              <div className="sr-only" role="status" aria-live="polite">
                {isSharing ? 'Creating link' : shareCopied ? 'Link copied' : shareUrl ? 'Link ready' : ''}
              </div>
            )}
            {shareError && <p className="text-right text-xs font-medium text-rose-600" role="alert">{shareError}</p>}
            {shareUrl && (
              <div className="space-y-2 rounded-xl border border-pink-200 bg-pink-50/60 p-3">
                <p className="text-sm font-semibold text-pink-800">Your surprise is ready!</p>
                <input
                  readOnly
                  value={shareUrl}
                  aria-label="Surprise link"
                  onFocus={(event) => event.currentTarget.select()}
                  className="w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs text-gray-700"
                />
                {!shareCopied && <p className="text-xs text-gray-600">Your surprise is ready. Copy the link below.</p>}
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setShareCopied(true);
                    } catch {
                      setShareError('Clipboard access is unavailable. Select the link above to copy it manually.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-pink-300 bg-white px-3 py-1.5 text-xs font-semibold text-pink-700"
                >
                  <Check size={14} /> Copy link
                </button>
              </div>
            )}
            {/* TAB 1: PHOTOS */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                {/* Main Polaroid Photo */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Main Polaroid Photo (Landing Scene)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-pink-300 shadow-md bg-gray-100 flex-shrink-0">
                      <img
                        src={tempConfig.mainPhoto}
                        alt="Main Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => mainPhotoInputRef.current?.click()}
                        className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs sm:text-sm font-medium rounded-xl border border-pink-200 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload size={16} /> Change Main Photo
                      </button>
                      <p className="text-xs text-gray-500">
                        Supports JPG, PNG, WEBP from your phone or device
                      </p>
                      <input
                        ref={mainPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMainPhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Gallery Photos (3D Space Scene) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-800">
                      3D Space Gallery Photos ({tempConfig.galleryPhotos.length})
                    </label>
                    <button
                      onClick={() => galleryPhotosInputRef.current?.click()}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Add Multiple Photos
                    </button>
                    <input
                      ref={galleryPhotosInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Photos Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tempConfig.galleryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-xl overflow-hidden border border-pink-200 bg-pink-50/50 p-2 flex flex-col gap-2"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/10 relative">
                          <img
                            src={photo.url}
                            alt="Memory"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveGalleryPhoto(photo.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                            title="Remove Photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={photo.caption}
                          placeholder="Caption..."
                          onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white rounded border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear / Reset buttons */}
                <div className="pt-4 border-t border-pink-100 flex flex-wrap gap-2 justify-between">
                  <button
                    onClick={onClearPhotos}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                  >
                    Clear All Photos
                  </button>
                  <button
                    onClick={onResetDefaults}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={13} /> Reset Demo Photos
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: NAMES & PASSCODE */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Recipient Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={tempConfig.recipientName}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, recipientName: e.target.value })
                    }
                    placeholder="e.g. My Girl, Sarah, Sweetheart"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sender Signature Name
                  </label>
                  <input
                    type="text"
                    value={tempConfig.senderName}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, senderName: e.target.value })
                    }
                    placeholder="e.g. Yours Forever, Alex"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Passcode (4 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={tempConfig.passcode}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, passcode: e.target.value })
                    }
                    placeholder="e.g. 1234 or 2024"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-mono font-bold"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Tip: Enter any 4 numbers (default is 1234).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Polaroid Bottom Caption
                  </label>
                  <input
                    type="text"
                    value={tempConfig.polaroidText}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, polaroidText: e.target.value })
                    }
                    placeholder="e.g. Happy Birthday ❤️"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Cake Sliced Celebration Heading
                  </label>
                  <input
                    type="text"
                    value={tempConfig.cakeCelebrationText}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, cakeCelebrationText: e.target.value })
                    }
                    placeholder="e.g. Happy Birthday, My Girl! 💖"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: LOVE LETTER */}
            {activeTab === 'letter' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Letter Title
                  </label>
                  <input
                    type="text"
                    value={tempConfig.letterTitle}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, letterTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Greeting Line
                  </label>
                  <input
                    type="text"
                    value={tempConfig.letterGreeting}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, letterGreeting: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Letter Message Paragraphs (One per line)
                  </label>
                  <textarea
                    rows={6}
                    value={tempConfig.letterBody.join('\n\n')}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        letterBody: e.target.value
                          .split('\n\n')
                          .filter((p) => p.trim() !== ''),
                      })
                    }
                    placeholder="Write your beautiful love message here..."
                    className="w-full p-3.5 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Letter Closing
                  </label>
                  <input
                    type="text"
                    value={tempConfig.letterClosing}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, letterClosing: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:border-pink-400 text-gray-800 text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Background Music Track
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload your favorite song (MP3, WAV) or enjoy the built-in romantic melody synthesizer.
                  </p>

                  <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-pink-500 text-white rounded-xl shadow-md">
                        <Music size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {tempConfig.musicTitle || 'Romantic Melody 🎵'}
                        </p>
                        <span className="text-xs text-pink-600 font-medium">
                          {tempConfig.customAudioUrl ? 'Custom Song Uploaded' : 'Built-in Romantic Chimes'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white hover:bg-pink-100 text-pink-700 text-xs font-semibold rounded-xl border border-pink-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={15} /> Upload MP3
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-pink-100 bg-pink-50/40 px-3 py-2.5 sm:flex-nowrap sm:px-6 sm:py-4">
            {onShareCurrentConfig && (
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="order-first flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:from-pink-700 hover:to-rose-600 disabled:opacity-60 sm:order-last sm:w-auto sm:text-sm"
              >
                {isSharing ? 'Creating link...' : shareCopied ? <><Check size={16} className="mr-1.5" /> Link copied!</> : shareUrl ? 'Copy link' : 'Create link'}
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onReplay();
              }}
              aria-label="Replay journey"
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-pink-100/60 hover:text-pink-600 sm:px-4 sm:text-sm"
            >
              <RotateCcw size={14} />
              <span className="max-[390px]:hidden sm:inline">Replay Journey</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="min-h-11 rounded-xl px-2 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700 sm:px-4 sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex min-h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-rose-600 sm:px-6 sm:text-sm"
              >
                {savedBadge ? <Check size={16} /> : null}
                <span>{savedBadge ? 'Saved' : 'Save changes'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

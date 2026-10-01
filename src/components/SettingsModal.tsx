import React, { useState, useRef, useEffect } from 'react';
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
import { DEFAULT_CONFIG } from '../data/defaultData';
import { AppConfig, PhotoItem, ShareResult } from '../types';
import { useModalAccessibility } from '../utils/useModalAccessibility';
import { clearCreatorDraft, loadCreatorDraft, saveCreatorDraft } from '../utils/creatorDraft';

const MAX_GALLERY_PHOTOS = 10;
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_SELECTED_PHOTO_BYTES = 60 * 1024 * 1024;

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read photo'));
  reader.onerror = () => reject(reader.error || new Error('Unable to read photo'));
  reader.readAsDataURL(file);
});

const dataUrlBytes = (value: string) => value.startsWith('data:') ? Math.floor(value.length * 0.75) : 0;

interface SettingsModalProps {
  isOpen: boolean;
  config: AppConfig;
  onClose: () => void;
  onSave: (newConfig: AppConfig) => void;
  onClearPhotos: () => void;
  onReplay: () => void;
  onShareCurrentConfig?: (config?: AppConfig, onProgress?: (stage: string) => void) => Promise<ShareResult>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
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
  const [shareStage, setShareStage] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftPhotosMissing, setDraftPhotosMissing] = useState(false);
  const [draftPublished, setDraftPublished] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const dialogRef = useModalAccessibility(isOpen, onClose);
  const shareInFlightRef = useRef(false);

  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryPhotosInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const updateTempConfig = (update: React.SetStateAction<AppConfig>) => {
    setDraftDirty(true);
    setTempConfig(update);
  };

  useEffect(() => {
    let active = true;
    loadCreatorDraft().then((draft) => {
      if (!active) return;
      if (draft) {
        setTempConfig({
          ...config,
          ...draft,
          mainPhoto: draft.mainPhoto || config.mainPhoto,
          galleryPhotos: (draft.galleryPhotos || config.galleryPhotos).filter((photo) => Boolean(photo.url)),
        });
        setDraftRestored(true);
        setDraftDirty(true);
        setDraftPhotosMissing(!draft.mainPhoto || Boolean(draft.galleryPhotos?.some((photo) => !photo.url)));
      }
      setDraftReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!draftReady || !draftDirty || isSharing || draftPublished) return;
    const timeout = window.setTimeout(() => {
      void saveCreatorDraft(tempConfig).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [tempConfig, draftReady, draftDirty, isSharing, draftPublished]);

  useEffect(() => {
    if (!draftReady || !draftDirty || draftPublished) return;
    const flushDraft = () => { void saveCreatorDraft(tempConfig).catch(() => undefined); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };
    window.addEventListener('pagehide', flushDraft);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushDraft);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tempConfig, draftReady, draftDirty, draftPublished]);

  const validatePhotoFiles = (files: File[], replacingMain = false) => {
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))) {
      setShareError('Choose JPG, PNG, WEBP, or GIF photos.');
      return false;
    }
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      setShareError('Each photo must be 20 MB or smaller.');
      return false;
    }
    const nextCount = tempConfig.galleryPhotos.length + (replacingMain ? 0 : files.length);
    if (nextCount > MAX_GALLERY_PHOTOS) {
      setShareError(`Choose no more than ${MAX_GALLERY_PHOTOS} gallery photos.`);
      return false;
    }
    const existingBytes = dataUrlBytes(tempConfig.mainPhoto)
      + tempConfig.galleryPhotos.reduce((total, photo) => total + dataUrlBytes(photo.url), 0)
      - (replacingMain ? dataUrlBytes(tempConfig.mainPhoto) : 0);
    if (existingBytes + files.reduce((total, file) => total + file.size, 0) > MAX_SELECTED_PHOTO_BYTES) {
      setShareError('Selected photos must total 60 MB or less. Remove a photo and try again.');
      return false;
    }
    setShareError('');
    return true;
  };

  const handleMainPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validatePhotoFiles([file], true)) return;
    try {
      const mainPhoto = await readFileAsDataUrl(file);
      updateTempConfig((prev) => ({ ...prev, mainPhoto }));
    } catch {
      setShareError('We could not read that photo. Please choose it again.');
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    e.target.value = '';
    if (!files.length || !validatePhotoFiles(files)) return;
    try {
      const photos: PhotoItem[] = await Promise.all(files.map(async (file, index) => ({
        id: `custom-${Date.now()}-${index}`,
        url: await readFileAsDataUrl(file),
        caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Special Memory',
        date: 'Cherished Moment',
        rotation: (Math.random() * 14) - 7,
        x: Math.floor(Math.random() * 70) + 15,
        y: Math.floor(Math.random() * 60) + 20,
        z: Math.floor(Math.random() * 80) - 20,
        scale: 1,
      })));
      updateTempConfig((prev) => ({ ...prev, galleryPhotos: [...prev.galleryPhotos, ...photos] }));
    } catch {
      setShareError('We could not read one of those photos. Please choose them again.');
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateTempConfig((prev) => ({
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
    updateTempConfig((prev) => ({
      ...prev,
      galleryPhotos: prev.galleryPhotos.filter((p) => p.id !== id),
    }));
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    updateTempConfig((prev) => ({
      ...prev,
      galleryPhotos: prev.galleryPhotos.map((p) => (p.id === id ? { ...p, caption } : p)),
    }));
  };

  const handleSave = () => {
    onSave(tempConfig);
    void saveCreatorDraft(tempConfig).catch(() => undefined);
    setSavedBadge(true);
    setTimeout(() => {
      setSavedBadge(false);
    }, 600);
  };

  const handleShare = async () => {
    if (!onShareCurrentConfig || shareInFlightRef.current) return;
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
    if (!draftReady) return;
    if (!tempConfig.recipientName.trim() || !tempConfig.senderName.trim() || !/^\d{4,12}$/.test(tempConfig.passcode)) {
      setShareError('Add both names and a passcode of 4 to 12 digits before creating your link.');
      return;
    }
    if (tempConfig.letterBody.length > 12 || tempConfig.galleryPhotos.length > MAX_GALLERY_PHOTOS) {
      setShareError('Your surprise has too many letter paragraphs or photos. Please remove some and retry.');
      return;
    }
    setShareError('');
    setShareUrl('');
    setShareCopied(false);
    shareInFlightRef.current = true;
    setIsSharing(true);
    setShareStage('Preparing photos...');
    try {
      await saveCreatorDraft(tempConfig);
      const result = await onShareCurrentConfig(tempConfig, setShareStage);
      onSave(tempConfig);
      setShareUrl(result.url);
      setShareCopied(result.copied);
      setDraftPublished(true);
      if (!result.copied) setShareError('Your surprise is saved. Select the link above to copy it manually.');
    } catch (error) {
      if (error instanceof Error && error.name === 'OfflineError') {
        setShareError("You're offline. Your draft is saved. Reconnect and try again.");
      } else if (error instanceof Error && error.name === 'TimeoutError') {
        setShareError('This is taking too long. Your draft is saved; check your connection and try again.');
      } else if (error instanceof Error && error.name === 'NetworkError') {
        setShareError("We couldn't reach Dearli. Your draft is saved; check your connection and try again.");
      } else if (error instanceof Error && error.name === 'MediaUploadError') {
        setShareError("We couldn't upload one of your photos. Please check your connection and try again.");
      } else if (error instanceof Error && error.name === 'PayloadTooLargeError') {
        setShareError('These photos or your audio are too large to send together. Choose fewer or smaller files, then retry.');
      } else if (error instanceof Error && error.name === 'ValidationError') {
        setShareError('Some surprise details need attention. Check the names, passcode, and photos, then retry.');
      } else if (error instanceof Error && error.name === 'DatabaseError') {
        setShareError("We couldn't save your surprise right now. Your changes are safe; please try again.");
      } else {
        setShareError("We couldn't save your surprise right now. Your changes are safe; please try again.");
      }
    } finally {
      shareInFlightRef.current = false;
      setIsSharing(false);
      setShareStage('');
    }
  };

  const handleStartOver = async () => {
    if (!window.confirm('Start over and clear this creator draft?')) return;
    await clearCreatorDraft();
    setTempConfig(DEFAULT_CONFIG);
    setDraftDirty(false);
    setShareUrl('');
    setShareCopied(false);
    setShareError('');
    setDraftRestored(false);
    setDraftPhotosMissing(false);
    setDraftPublished(false);
    onSave(DEFAULT_CONFIG);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 backdrop-blur-sm select-none sm:items-center sm:p-4">
        <motion.div
          ref={dialogRef}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-pink-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:border"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              <h2 id="settings-title" className="font-serif text-xl sm:text-2xl font-bold text-gray-800">
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
                {isSharing ? shareStage || 'Creating your surprise...' : shareCopied ? 'Link copied' : shareUrl ? 'Link ready' : draftRestored ? 'Draft restored' : ''}
              </div>
            )}
            {draftRestored && (
              <p className="text-xs font-medium text-pink-700" role="status">
                {draftPhotosMissing ? 'Draft restored. Some photos were unavailable in this browser.' : 'Draft restored'}
              </p>
            )}
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
                        JPG, PNG, WEBP, or GIF. Up to 20 MB each; photos total 60 MB.
                      </p>
                      <input
                        ref={mainPhotoInputRef}
                        type="file"
                        aria-label="Upload main photo"
                        accept="image/jpeg,image/png,image/webp,image/gif"
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
                      aria-label="Add gallery photos"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      disabled={tempConfig.galleryPhotos.length >= MAX_GALLERY_PHOTOS}
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
                            alt={photo.caption || 'Gallery photo preview'}
                            loading="lazy"
                            decoding="async"
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
                            aria-label={`Caption for ${photo.caption || 'gallery photo'}`}
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
                    onClick={() => updateTempConfig((prev) => ({
                      ...prev,
                      galleryPhotos: DEFAULT_CONFIG.galleryPhotos.map((photo) => ({ ...photo })),
                    }))}
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
                    aria-label="Recipient name"
                    value={tempConfig.recipientName}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, recipientName: e.target.value })
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
                    aria-label="Sender name"
                    value={tempConfig.senderName}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, senderName: e.target.value })
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
                    aria-label="Passcode"
                    maxLength={6}
                    value={tempConfig.passcode}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, passcode: e.target.value })
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
                    aria-label="Polaroid caption"
                    value={tempConfig.polaroidText}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, polaroidText: e.target.value })
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
                    aria-label="Cake celebration heading"
                    value={tempConfig.cakeCelebrationText}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, cakeCelebrationText: e.target.value })
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
                    aria-label="Letter title"
                    value={tempConfig.letterTitle}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, letterTitle: e.target.value })
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
                    aria-label="Letter greeting"
                    value={tempConfig.letterGreeting}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, letterGreeting: e.target.value })
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
                    aria-label="Letter message paragraphs"
                    value={tempConfig.letterBody.join('\n\n')}
                    onChange={(e) =>
                      updateTempConfig({
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
                    aria-label="Letter closing"
                    value={tempConfig.letterClosing}
                    onChange={(e) =>
                      updateTempConfig({ ...tempConfig, letterClosing: e.target.value })
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
                      aria-label="Upload background music"
                      className="px-3.5 py-2 bg-white hover:bg-pink-100 text-pink-700 text-xs font-semibold rounded-xl border border-pink-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={15} /> Upload MP3
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      aria-label="Upload background music"
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
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-pink-100 bg-pink-50/40 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-nowrap sm:px-6 sm:py-4">
            {shareError && <p className="order-first basis-full text-center text-xs font-medium text-rose-600" role="alert">{shareError}</p>}
            {onShareCurrentConfig && (
              <button
                onClick={handleShare}
                disabled={isSharing || !draftReady}
                className="order-first flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:from-pink-700 hover:to-rose-600 disabled:opacity-60 sm:order-last sm:w-auto sm:text-sm"
              >
                {isSharing ? shareStage || 'Creating your surprise...' : shareCopied ? <><Check size={16} className="mr-1.5" /> Link copied!</> : shareUrl ? 'Copy link' : shareError ? 'Try again' : 'Create link'}
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
                onClick={() => void handleStartOver()}
                disabled={isSharing}
                className="min-h-11 rounded-xl px-2 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-pink-100/60 hover:text-pink-600 disabled:opacity-50 sm:px-3"
              >
                Start over
              </button>
              <button
                onClick={onClose}
                className="min-h-11 rounded-xl px-2 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700 sm:px-4 sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!draftReady}
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

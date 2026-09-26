import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Gift, Settings } from 'lucide-react';
import { DEFAULT_CONFIG } from './data/defaultData';
import { AppConfig, SceneType, ShareResult } from './types';
import { musicPlayer } from './utils/audio';

import { FloatingHearts } from './components/FloatingHearts';
import { MusicPlayer } from './components/MusicPlayer';
import { FloralTransition } from './components/FloralTransition';
import { LoveNotesModal } from './components/LoveNotesModal';
import { LoveReasonsModal } from './components/LoveReasonsModal';
import { SettingsModal } from './components/SettingsModal';

import { LandingScene } from './components/LandingScene';
import { LampScene } from './components/LampScene';
import { CakeScene } from './components/CakeScene';
import { LetterScene } from './components/LetterScene';
import { SpaceGalleryScene } from './components/SpaceGalleryScene';

const STORAGE_KEY = 'romantic_birthday_app_config_v3';
const SHARE_PARAM = 'surprise';

const getSharedSurpriseId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const routeMatch = window.location.pathname.match(/^\/surprise\/([^/]+)\/?$/);
  if (routeMatch) {
    try {
      return decodeURIComponent(routeMatch[1]);
    } catch {
      return null;
    }
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(SHARE_PARAM) || null;
};

const buildShareableUrl = (id: unknown) => {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Surprise creation returned an invalid ID');
  }
  return new URL(`/surprise/${id}`, window.location.origin).toString();
};

const createLockedConfig = (recipientName: string, senderName: string): AppConfig => ({
  ...DEFAULT_CONFIG,
  recipientName,
  senderName,
  mainPhoto: '',
  polaroidText: '',
  passcode: '',
  cakeHeading: '',
  cakeCelebrationText: '',
  letterTitle: '',
  letterGreeting: '',
  letterBody: [],
  letterClosing: '',
  galleryPhotos: [],
  customAudioUrl: undefined,
  musicTitle: '',
});

type SharedSurpriseState = 'loading' | 'locked' | 'unlocked' | 'not-found' | 'error';
export default function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  const sharedSurpriseId = getSharedSurpriseId();
  const [sharedSurpriseState, setSharedSurpriseState] = useState<SharedSurpriseState>(
    sharedSurpriseId ? 'loading' : 'unlocked',
  );
  const [sharedPasscodeLength, setSharedPasscodeLength] = useState(4);

  useEffect(() => {
    if (!sharedSurpriseId) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const { passcode, ...safeSavedConfig } = parsed;
          setConfig({ ...DEFAULT_CONFIG, ...safeSavedConfig });
        }
      } catch (e) {
        // Ignore
      }
      return;
    }

    let isMounted = true;
    fetch(`/api/surprises/${encodeURIComponent(sharedSurpriseId)}`)
      .then(async (response) => {
        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const result = contentType.includes('application/json')
            ? await response.json().catch(() => null)
            : null;
          const isSurpriseNotFound = response.status === 404 && result?.error === 'Surprise not found';
          const error = new Error(isSurpriseNotFound ? 'Surprise not found' : 'Unable to load surprise');
          error.name = isSurpriseNotFound ? 'NotFoundError' : 'NetworkError';
          throw error;
        }
        const result = await response.json();
        if (isMounted) {
          setConfig(createLockedConfig(
            result.recipientName || 'Your surprise',
            result.senderName || 'Someone special',
          ));
          setSharedPasscodeLength(result.passcodeLength || 4);
          setSharedSurpriseState('locked');
        }
      })
      .catch((error: Error) => {
        if (isMounted) {
          setConfig(DEFAULT_CONFIG);
          setSharedSurpriseState(error.name === 'NotFoundError' ? 'not-found' : 'error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sharedSurpriseId]);

  const handleSharedUnlock = async (passcode: string) => {
    if (!sharedSurpriseId) return false;
    const response = await fetch(`/api/surprises/${encodeURIComponent(sharedSurpriseId)}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    if (!response.ok) {
      if (response.status === 401) return false;
      throw new Error('This surprise could not be unlocked right now. Please try again.');
    }
    const result = await response.json();
    setConfig({ ...DEFAULT_CONFIG, ...result.config, passcode: '' });
    setSharedSurpriseState('unlocked');
    return true;
  };

  const [entryMode, setEntryMode] = useState<'home' | 'demo'>(() => {
    if (typeof window !== 'undefined') {
      const hasSharedConfig = getSharedSurpriseId();
      return hasSharedConfig ? 'demo' : 'home';
    }
    return 'home';
  });
  const [currentScene, setCurrentScene] = useState<SceneType>('landing');
  const [isFloralActive, setIsFloralActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isLoveReasonsOpen, setIsLoveReasonsOpen] = useState(false);

  // Sync custom audio if configured
  useEffect(() => {
    if (config.customAudioUrl) {
      musicPlayer.setCustomAudio(config.customAudioUrl);
    }
  }, [config.customAudioUrl]);

  const persistLocalConfig = (nextConfig: AppConfig) => {
    const { passcode, ...safeConfig } = nextConfig;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
    } catch (e) {
      // Ignore storage failures
    }
  };

  // Save content locally, but never persist the creator's passcode.
  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    persistLocalConfig(newConfig);
  };

  const handleShareCurrentConfig = async (configToShare = config): Promise<ShareResult> => {
    const response = await fetch('/api/surprises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configToShare }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      const error = new Error(result.error || 'Unable to create shareable surprise');
      error.name = result.code === 'MEDIA_UPLOAD_FAILED' ? 'MediaUploadError' : 'SurpriseSaveError';
      throw error;
    }

    const result = await response.json();
    const shareUrl = buildShareableUrl(result.id);

    let copied = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
    } catch {
      copied = false;
    }
    return { url: shareUrl, copied };
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  };

  const handleClearPhotos = () => {
    const cleared = {
      ...config,
      galleryPhotos: [],
    };
    setConfig(cleared);
    persistLocalConfig(cleared);
  };

  const handleUpdateMainPhoto = (url: string) => {
    const updated = { ...config, mainPhoto: url };
    handleSaveConfig(updated);
  };

  const handleAddGalleryPhotos = (files: FileList) => {
    (Array.from(files) as File[]).forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newPhoto = {
            id: `upload-${Date.now()}-${index}`,
            url: ev.target!.result as string,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Cherished Memory ❤️',
            date: 'Happy Moment',
            rotation: Math.random() * 14 - 7,
            x: Math.floor(Math.random() * 70) + 15,
            y: Math.floor(Math.random() * 60) + 20,
            z: Math.floor(Math.random() * 80) - 20,
            scale: 1,
          };
          setConfig((prev) => {
            const nextPhotos = [...prev.galleryPhotos, newPhoto];
            const updated = { ...prev, galleryPhotos: nextPhotos };
            persistLocalConfig(updated);
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Scene Transitions
  const handlePasscodeSuccess = () => {
    setIsFloralActive(true);
  };

  const handleFloralComplete = () => {
    setIsFloralActive(false);
    setCurrentScene('lamp');
  };

  const handleReplay = () => {
    setCurrentScene('landing');
  };

  const handleStartDemo = () => {
    setEntryMode('demo');
    setCurrentScene('landing');
  };

  const handleCreateOwnSurprise = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.assign('/');
  };

  const isDarkScene = currentScene === 'space';

  if (entryMode === 'home') {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 flex items-center justify-center p-6 text-gray-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.15),_transparent_30%)]" />

        <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-pink-200/80 bg-white/70 p-8 shadow-[0_20px_80px_-25px_rgba(244,114,182,0.4)] backdrop-blur-xl sm:p-12">
          <div className="text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-pink-500">Birthday surprise</p>
            <h1 className="font-serif text-4xl font-bold text-gray-800 sm:text-5xl">A little love, beautifully wrapped</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-gray-600 sm:text-lg">
              Let the demo guide your loved one through a romantic surprise, or create a custom page and send a shareable link to family, friends, or your partner.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <button
              onClick={handleStartDemo}
              className="group rounded-[1.5rem] border border-pink-200 bg-gradient-to-br from-pink-500 to-rose-500 p-6 text-left text-white shadow-lg shadow-pink-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 inline-flex rounded-full bg-white/15 p-3">
                <Gift size={24} />
              </div>
              <h2 className="text-2xl font-bold">Try the demo</h2>
              <p className="mt-3 text-sm text-pink-50/90">
                Experience the full guided surprise flow with the default romantic message, music, and gallery.
              </p>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="group rounded-[1.5rem] border border-amber-200 bg-gradient-to-br from-amber-100 to-orange-100 p-6 text-left text-gray-800 shadow-lg shadow-amber-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 inline-flex rounded-full bg-white/70 p-3">
                <Settings size={24} className="text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold">Create my surprise link</h2>
              <p className="mt-3 text-sm text-gray-600">
                Personalize the names, photos, letter, and music, then copy a shareable link for your loved one or family.
              </p>
            </button>
          </div>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          config={config}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveConfig}
          onResetDefaults={handleResetDefaults}
          onClearPhotos={handleClearPhotos}
          onReplay={handleReplay}
          onShareCurrentConfig={handleShareCurrentConfig}
        />
      </main>
    );
  }

  if (sharedSurpriseState === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 p-6 text-center text-gray-700">
        Loading your surprise...
      </main>
    );
  }

  if (sharedSurpriseState === 'not-found') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 p-6 text-center text-gray-700">
        <div>
          <h1 className="font-serif text-4xl font-bold text-gray-800">Surprise not found</h1>
          <p className="mt-3">This link may be invalid or the surprise is no longer available.</p>
        </div>
      </main>
    );
  }

  if (sharedSurpriseState === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 p-6 text-center text-gray-700">
        <div>
          <h1 className="font-serif text-4xl font-bold text-gray-800">Unable to load surprise</h1>
          <p className="mt-3">Please check your connection and try opening the link again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full font-sans antialiased overflow-hidden select-none">
      {/* Background Floating Hearts Particle Ambiance (only for pastel scenes) */}
      {!isDarkScene && <FloatingHearts count={16} />}

      {/* Persistent Romantic Music Player */}
      {(sharedSurpriseState === 'unlocked' || !sharedSurpriseId) && (
        <MusicPlayer
          customMusicTitle={config.musicTitle}
          onUploadCustomMusic={(file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (ev.target?.result) {
                const url = ev.target.result as string;
                handleSaveConfig({
                  ...config,
                  customAudioUrl: url,
                  musicTitle: file.name.replace(/\.[^/.]+$/, ''),
                });
              }
            };
            reader.readAsDataURL(file);
          }}
          dark={isDarkScene}
          canUpload={!sharedSurpriseId}
        />
      )}

      {/* Floral Blossom Burst Transition (00:03 - 00:04 in video) */}
      <FloralTransition
        isActive={isFloralActive}
        onComplete={handleFloralComplete}
      />

      {/* SCENE ROUTER */}
      <AnimatePresence mode="wait">
        {currentScene === 'landing' && (
          <LandingScene
            key="landing"
            mainPhoto={config.mainPhoto}
            polaroidText={config.polaroidText}
            passcode={config.passcode}
            recipientName={config.recipientName}
            onSuccess={handlePasscodeSuccess}
            onUpdateMainPhoto={handleUpdateMainPhoto}
            onOpenSettings={sharedSurpriseId ? () => undefined : () => setIsSettingsOpen(true)}
            onOpenNotes={() => setIsNotesOpen(true)}
            onOpenLoveReasons={() => setIsLoveReasonsOpen(true)}
            onShare={handleShareCurrentConfig}
            passcodeLength={sharedSurpriseId ? sharedPasscodeLength : undefined}
            onUnlock={sharedSurpriseId ? handleSharedUnlock : undefined}
            isLocked={sharedSurpriseState === 'locked'}
            isRecipientMode={Boolean(sharedSurpriseId)}
          />
        )}

        {currentScene === 'lamp' && (
          <LampScene
            key="lamp"
            onComplete={() => setCurrentScene('cake')}
          />
        )}

        {currentScene === 'cake' && (
          <CakeScene
            key="cake"
            heading={config.cakeHeading}
            celebrationText={config.cakeCelebrationText}
            onNext={() => setCurrentScene('letter')}
          />
        )}

        {currentScene === 'letter' && (
          <LetterScene
            key="letter"
            title={config.letterTitle}
            greeting={config.letterGreeting}
            body={config.letterBody}
            closing={config.letterClosing}
            senderName={config.senderName}
            recipientName={config.recipientName}
            onNext={() => setCurrentScene('space')}
            onEditLetter={sharedSurpriseId ? undefined : () => setIsSettingsOpen(true)}
          />
        )}

        {currentScene === 'space' && (
          <SpaceGalleryScene
            key="space"
            photos={config.galleryPhotos}
            recipientName={config.recipientName}
            onReplay={handleReplay}
            onOpenSettings={sharedSurpriseId ? undefined : () => setIsSettingsOpen(true)}
            onAddPhotos={sharedSurpriseId ? undefined : handleAddGalleryPhotos}
            onOpenLoveReasons={() => setIsLoveReasonsOpen(true)}
            isRecipientMode={Boolean(sharedSurpriseId)}
            onCreateOwn={sharedSurpriseId ? handleCreateOwnSurprise : undefined}
          />
        )}
      </AnimatePresence>

      {/* Reasons I Love You & Love Match Modal */}
      <LoveReasonsModal
        isOpen={isLoveReasonsOpen}
        onClose={() => setIsLoveReasonsOpen(false)}
        recipientName={config.recipientName}
      />

      {/* Love Notes & Comments Modal */}
      <LoveNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        recipientName={config.recipientName}
      />

      {/* Customization Settings Drawer / Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        config={config}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        onResetDefaults={handleResetDefaults}
        onClearPhotos={handleClearPhotos}
        onReplay={handleReplay}
        onShareCurrentConfig={handleShareCurrentConfig}
      />
    </main>
  );
}

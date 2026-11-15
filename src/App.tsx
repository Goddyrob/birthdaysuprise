import { mediaDigest, findUploadReceipt, rememberUpload } from './utils/uploadReceipts';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { DearliHome } from './components/DearliHome';
import { apiFetch, publicOrigin } from './utils/api';
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Gift, Settings } from 'lucide-react';
import { DEFAULT_CONFIG } from './data/defaultData';
import { AppConfig, SceneType, ShareResult } from './types';
import { musicPlayer } from './utils/audio';
import { prepareConfigForShare } from './utils/shareMedia';
import { clearCreatorDraft, getCreatorCreationId, loadCreatorDraft } from './utils/creatorDraft';
import { DeveloperCredit } from './components/DeveloperCredit';

const MusicPlayer = lazy(() => import('./components/MusicPlayer').then((module) => ({ default: module.MusicPlayer })));
const FloralTransition = lazy(() => import('./components/FloralTransition').then((module) => ({ default: module.FloralTransition })));
const LoveNotesModal = lazy(() => import('./components/LoveNotesModal').then((module) => ({ default: module.LoveNotesModal })));
const LoveReasonsModal = lazy(() => import('./components/LoveReasonsModal').then((module) => ({ default: module.LoveReasonsModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then((module) => ({ default: module.SettingsModal })));
const LandingScene = lazy(() => import('./components/LandingScene').then((module) => ({ default: module.LandingScene })));
const LampScene = lazy(() => import('./components/LampScene').then((module) => ({ default: module.LampScene })));
const CakeScene = lazy(() => import('./components/CakeScene').then((module) => ({ default: module.CakeScene })));
const LetterScene = lazy(() => import('./components/LetterScene').then((module) => ({ default: module.LetterScene })));
const SpaceGalleryScene = lazy(() => import('./components/SpaceGalleryScene').then((module) => ({ default: module.SpaceGalleryScene })));

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
  return new URL(`/surprise/${id}`, publicOrigin).toString();
};

const createLockedConfig = (recipientName: string, senderName: string, previewPhoto: string): AppConfig => ({
  ...DEFAULT_CONFIG,
  recipientName,
  senderName,
  mainPhoto: previewPhoto || '/default-surprise.svg',
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
    document.querySelector('meta[name="robots"]')?.setAttribute(
      'content',
      sharedSurpriseId ? 'noindex, nofollow, noarchive' : 'index, follow',
    );
  }, [sharedSurpriseId]);

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
      void loadCreatorDraft().then((draft) => {
        if (draft) setIsSettingsOpen(true);
      });
      return;
    }

    let isMounted = true;
    apiFetch(`/api/surprises/${encodeURIComponent(sharedSurpriseId)}`)
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
            result.previewPhoto,
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
    const response = await apiFetch(`/api/surprises/${encodeURIComponent(sharedSurpriseId)}/unlock`, {
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
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      void SystemBars.setStyle({ style: currentScene === 'space' && !isSettingsOpen ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => undefined);
    }
  }, [currentScene, isSettingsOpen]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isLoveReasonsOpen, setIsLoveReasonsOpen] = useState(false);

  useEffect(() => {
    const handleNativeBack = (event: Event) => {
      if (isFloralActive) {
        event.preventDefault();
        setIsFloralActive(false);
      } else if (currentScene !== 'landing') {
        event.preventDefault();
        const previousScene: Record<string, SceneType> = {
          space: 'letter', letter: 'cake', cake: 'lamp', lamp: 'landing',
        };
        setCurrentScene(previousScene[currentScene] || 'landing');
      } else if (entryMode === 'demo' && !sharedSurpriseId) {
        event.preventDefault();
        setEntryMode('home');
      }
    };
    window.addEventListener('dearli:back', handleNativeBack);
    return () => window.removeEventListener('dearli:back', handleNativeBack);
  }, [currentScene, entryMode, isFloralActive, sharedSurpriseId]);

  // Sync custom audio if configured
  useEffect(() => {
    if (config.customAudioUrl) {
      musicPlayer.setCustomAudio(config.customAudioUrl);
    }
  }, [config.customAudioUrl]);

  const persistLocalConfig = (nextConfig: AppConfig) => {
    const { passcode, ...safeConfig } = nextConfig;
    safeConfig.mainPhoto = safeConfig.mainPhoto.startsWith('data:') || safeConfig.mainPhoto.startsWith('blob:')
      ? DEFAULT_CONFIG.mainPhoto
      : safeConfig.mainPhoto;
    safeConfig.galleryPhotos = safeConfig.galleryPhotos.filter((photo) =>
      !photo.url.startsWith('data:') && !photo.url.startsWith('blob:'),
    );
    if (safeConfig.customAudioUrl?.startsWith('data:') || safeConfig.customAudioUrl?.startsWith('blob:')) {
      safeConfig.customAudioUrl = undefined;
    }
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

  const handleShareCurrentConfig = async (
    configToShare = config,
    onProgress?: (stage: string) => void,
  ): Promise<ShareResult> => {
    const requestId = getCreatorCreationId();
    const startedAt = performance.now();
    const logStage = (stage: string, stageStartedAt: number, details: Record<string, string | number> = {}) => {
      console.info(JSON.stringify({
        event: 'creation_stage',
        requestId,
        stage,
        elapsedMs: Math.round(performance.now() - stageStartedAt),
        ...details,
      }));
    };

    if (!navigator.onLine) {
      console.warn(JSON.stringify({ event: 'creation_stage', requestId, stage: 'network_preflight', status: 'error', category: 'offline' }));
      const error = new Error('You are offline');
      error.name = 'OfflineError';
      throw error;
    }

    const imageCount = 1 + configToShare.galleryPhotos.length;
    const imageBytes = [configToShare.mainPhoto, ...configToShare.galleryPhotos.map((photo) => photo.url)]
      .reduce((total, source) => total + (source.startsWith('data:') ? Math.floor(source.length * 0.75) : 0), 0);
    onProgress?.('Preparing photos...');
    const preparationStartedAt = performance.now();
    let preparedConfig: AppConfig;
    try {
      preparedConfig = await prepareConfigForShare(configToShare);
    } catch (error) {
      console.warn(JSON.stringify({
        event: 'creation_stage',
        requestId,
        stage: 'image_preparation',
        status: 'error',
        elapsedMs: Math.round(performance.now() - preparationStartedAt),
        imageCount,
        category: error instanceof Error ? error.name : 'preparation_error',
      }));
      throw error;
    }
    logStage('image_preparation', preparationStartedAt, { imageCount, sourceImageBytes: imageBytes });
    onProgress?.('Uploading photos...');
    const mediaFiles = [
      ...(preparedConfig.mainPhoto.startsWith('data:') ? [{ key: 'main', kind: 'image', dataUrl: preparedConfig.mainPhoto }] : []),
      ...preparedConfig.galleryPhotos.flatMap((photo, index) => photo.url.startsWith('data:')
        ? [{ key: `gallery-${index}`, kind: 'image', dataUrl: photo.url }]
        : []),
      ...(preparedConfig.customAudioUrl?.startsWith('data:')
        ? [{ key: 'audio', kind: 'audio', dataUrl: preparedConfig.customAudioUrl }]
        : []),
    ];
    let mediaReferences = new Map<string, string>();
    const digests = new Map<string, string>();
    const pendingMedia = [];
    for (const file of mediaFiles) {
      const digest = await mediaDigest(file.dataUrl); digests.set(file.key, digest);
      const reference = findUploadReceipt(requestId, file.key, digest);
      if (reference) mediaReferences.set(file.key, reference); else pendingMedia.push(file);
    }
    if (pendingMedia.length > 0) {
      const mediaBody = JSON.stringify({ creationId: requestId, files: pendingMedia });
      const mediaPayloadBytes = new TextEncoder().encode(mediaBody).length;
      const mediaStartedAt = performance.now();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45_000);
      let mediaResponse: Response;
      let mediaHttpStatus = 0;
      try {
        mediaResponse = await apiFetch('/api/surprises/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId },
          body: mediaBody,
          signal: controller.signal,
        });
        mediaHttpStatus = mediaResponse.status;
      } catch {
        console.warn(JSON.stringify({
          event: 'creation_stage',
          requestId,
          stage: 'media_upload_request',
          status: 'error',
          elapsedMs: Math.round(performance.now() - mediaStartedAt),
          payloadBytes: mediaPayloadBytes,
          mediaCount: mediaFiles.length,
          category: controller.signal.aborted ? 'timeout' : 'network_error',
        }));
        const error = new Error(controller.signal.aborted ? 'Media upload timed out' : 'Media upload failed');
        error.name = controller.signal.aborted ? 'TimeoutError' : 'NetworkError';
        throw error;
      } finally {
        window.clearTimeout(timeout);
        logStage('media_upload_request', mediaStartedAt, { payloadBytes: mediaPayloadBytes, mediaCount: mediaFiles.length, httpStatus: mediaHttpStatus });
      }
      if (!mediaResponse.ok) {
        const result = await mediaResponse.json().catch(() => ({}));
        console.warn(JSON.stringify({ event: 'creation_stage', requestId, stage: 'media_upload_response', status: 'error', httpStatus: mediaResponse.status, category: result.code || 'media_upload_failed', payloadBytes: mediaPayloadBytes, mediaCount: mediaFiles.length }));
        const error = new Error('Unable to upload surprise media');
        error.name = mediaResponse.status === 413 || result.code === 'PAYLOAD_TOO_LARGE'
          ? 'PayloadTooLargeError'
          : result.code === 'VALIDATION_FAILED' ? 'ValidationError' : 'MediaUploadError';
        throw error;
      }
      const result = await mediaResponse.json();
      if (!Array.isArray(result.media) || pendingMedia.some(file => !result.media.some((item: {key: string; reference: string}) => item.key === file.key && typeof item.reference === 'string' && item.reference.startsWith('storage:' + requestId + '/')))) {
        const error = new Error('The media response was incomplete'); error.name = 'ServerResponseError'; throw error;
      }
      for (const file of result.media as Array<{key: string; reference: string}>) {
        mediaReferences.set(file.key, file.reference);
        const digest = digests.get(file.key); if (digest) rememberUpload(requestId, file.key, digest, file.reference);
      }
    }

    preparedConfig = {
      ...preparedConfig,
      mainPhoto: mediaReferences.get('main') || preparedConfig.mainPhoto,
      galleryPhotos: preparedConfig.galleryPhotos.map((photo, index) => ({
        ...photo,
        url: mediaReferences.get(`gallery-${index}`) || photo.url,
      })),
      customAudioUrl: mediaReferences.get('audio') || preparedConfig.customAudioUrl,
    };
    const body = JSON.stringify({ creationId: requestId, config: preparedConfig });
    const payloadBytes = new TextEncoder().encode(body).length;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    const apiStartedAt = performance.now();
    let response: Response;
    let apiHttpStatus = 0;
    try {
      response = await apiFetch('/api/surprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId },
        body,
        signal: controller.signal,
      });
      apiHttpStatus = response.status;
    } catch {
      console.warn(JSON.stringify({
        event: 'creation_stage',
        requestId,
        stage: 'api_request',
        status: 'error',
        elapsedMs: Math.round(performance.now() - apiStartedAt),
        payloadBytes,
        mediaCount: mediaFiles.length,
        category: controller.signal.aborted ? 'timeout' : 'network_error',
      }));
      const error = new Error(controller.signal.aborted ? 'Creation request timed out' : 'Creation request failed');
      error.name = controller.signal.aborted ? 'TimeoutError' : 'NetworkError';
      throw error;
    } finally {
      window.clearTimeout(timeout);
      logStage('api_request', apiStartedAt, { payloadBytes, mediaCount: mediaFiles.length, httpStatus: apiHttpStatus });
    }

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      const error = new Error('Unable to create shareable surprise');
      error.name = response.status === 413 || result.code === 'PAYLOAD_TOO_LARGE'
        ? 'PayloadTooLargeError'
        : result.code === 'MEDIA_UPLOAD_FAILED' ? 'MediaUploadError'
          : result.code === 'VALIDATION_FAILED' ? 'ValidationError'
            : result.code === 'SUPABASE_INSERT_FAILED' ? 'DatabaseError'
              : 'SurpriseSaveError';
      console.warn(JSON.stringify({ event: 'creation_stage', requestId, stage: 'api_response', status: 'error', httpStatus: response.status, category: result.code || 'api_failure', payloadBytes }));
      throw error;
    }

    onProgress?.('Almost ready...');
    const result = await response.json();
    if (typeof result.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(result.id)) { const error = new Error('The creation response was incomplete'); error.name = 'ServerResponseError'; throw error; }
    const shareUrl = buildShareableUrl(result.id);
    logStage('url_available', startedAt, { payloadBytes, imageCount, id: result.id });
    await clearCreatorDraft();

    let copied = false;
    const clipboardStartedAt = performance.now();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
    } catch {
      copied = false;
      console.warn(JSON.stringify({ event: 'creation_stage', requestId, stage: 'clipboard', status: 'error', category: 'clipboard_unavailable' }));
    }
    logStage('clipboard', clipboardStartedAt, { status: copied ? 'ok' : 'error' });
    return { url: shareUrl, copied };
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
      <main className="dearli-shell">
        <DearliHome onDemo={handleStartDemo} onCreate={() => setIsSettingsOpen(true)} />
        {isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsModal
              isOpen={isSettingsOpen}
              config={config}
              onClose={() => setIsSettingsOpen(false)}
              onSave={handleSaveConfig}
              onClearPhotos={handleClearPhotos}
              onReplay={handleReplay}
              onShareCurrentConfig={handleShareCurrentConfig}
            />
          </Suspense>
        )}
      </main>
    );
  }

  if (sharedSurpriseState === 'loading') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-rose-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-gray-700">
        Unfolding your surprise…
      </main>
    );
  }

  if (sharedSurpriseState === 'not-found') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-rose-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-gray-700">
        <div>
          <h1 className="font-serif text-2xl font-bold leading-tight text-gray-800 sm:text-4xl">Surprise not found</h1>
          <p className="mt-3">This link may be invalid or the surprise is no longer available.</p>
        </div>
      </main>
    );
  }

  if (sharedSurpriseState === 'error') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-rose-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-gray-700">
        <div>
          <h1 className="font-serif text-2xl font-bold leading-tight text-gray-800 sm:text-4xl">Unable to load surprise</h1>
          <p className="mt-3">Your surprise is still private. Check your connection, then try again.</p><button className="dearli-primary mx-auto mt-6" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-clip font-sans antialiased select-none">
      {/* Background Floating Hearts Particle Ambiance (only for pastel scenes) */}


      {/* Persistent Romantic Music Player */}
      {(sharedSurpriseState === 'unlocked' || !sharedSurpriseId) && (
        <Suspense fallback={null}><MusicPlayer
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
        /></Suspense>
      )}

      {/* Floral Blossom Burst Transition (00:03 - 00:04 in video) */}
      {isFloralActive && (
        <Suspense fallback={<div className="sr-only" role="status">Unfolding your surprise…</div>}>
          <FloralTransition isActive={isFloralActive} onComplete={handleFloralComplete} />
        </Suspense>
      )}

      {/* SCENE ROUTER */}
      <Suspense fallback={<div className="flex min-h-[100dvh] items-center justify-center bg-rose-50 px-4 text-center text-gray-700" role="status">Unfolding your surprise…</div>}>
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
      </Suspense>

      {/* Reasons I Love You & Love Match Modal */}
      {isLoveReasonsOpen && <Suspense fallback={null}><LoveReasonsModal isOpen={isLoveReasonsOpen} onClose={() => setIsLoveReasonsOpen(false)} recipientName={config.recipientName} /></Suspense>}

      {/* Love Notes & Comments Modal */}
      {isNotesOpen && <Suspense fallback={null}><LoveNotesModal isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} recipientName={config.recipientName} /></Suspense>}

      {/* Customization Settings Drawer / Modal */}
      {isSettingsOpen && <Suspense fallback={null}><SettingsModal isOpen={isSettingsOpen} config={config} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveConfig} onClearPhotos={handleClearPhotos} onReplay={handleReplay} onShareCurrentConfig={handleShareCurrentConfig} /></Suspense>}
    </main>
  );
}

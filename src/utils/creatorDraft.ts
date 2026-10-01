import { AppConfig } from '../types';

const DATABASE_NAME = 'dearli-creator-drafts';
const DATABASE_VERSION = 1;
const OBJECT_STORE = 'drafts';
const DRAFT_KEY = 'dearli.creatorDraft.v1';
const MEDIA_KEY = `${DRAFT_KEY}.media`;
const CREATION_ID_KEY = 'dearli.creatorDraft.creationId.v1';
let databasePromise: Promise<IDBDatabase> | undefined;
let lastMediaSignature = '';

interface DraftMedia {
  mainPhoto?: string;
  galleryPhotos: Record<string, string>;
  customAudioUrl?: string;
}

export const getCreatorCreationId = (): string => {
  try {
    const existing = localStorage.getItem(CREATION_ID_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(CREATION_ID_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
};

const openDraftDatabase = (): Promise<IDBDatabase> => {
  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(OBJECT_STORE)) {
          request.result.createObjectStore(OBJECT_STORE);
        }
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          databasePromise = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
};

const isLocalMedia = (value?: string) => Boolean(value?.startsWith('data:') || value?.startsWith('blob:'));

const mediaSignature = (config: AppConfig) => [
  config.mainPhoto,
  ...config.galleryPhotos.flatMap((photo) => [photo.id, photo.url]),
  config.customAudioUrl || '',
].map((value) => `${value.length}:${value.slice(0, 40)}:${value.slice(-40)}`).join('|');

const makeDraftMedia = (config: AppConfig): DraftMedia => ({
  mainPhoto: isLocalMedia(config.mainPhoto) ? config.mainPhoto : undefined,
  galleryPhotos: Object.fromEntries(config.galleryPhotos
    .filter((photo) => isLocalMedia(photo.url))
    .map((photo) => [photo.id, photo.url])),
  customAudioUrl: isLocalMedia(config.customAudioUrl) ? config.customAudioUrl : undefined,
});

const readFallbackDraft = (): Partial<AppConfig> | null => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) as Partial<AppConfig> : null;
  } catch {
    return null;
  }
};

export const loadCreatorDraft = async (): Promise<Partial<AppConfig> | null> => {
  const fallback = readFallbackDraft();
  if (typeof indexedDB === 'undefined') return fallback;

  try {
    const database = await openDraftDatabase();
    const { draft, media } = await new Promise<{ draft?: Partial<AppConfig>; media?: DraftMedia }>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE);
      let savedDraft: Partial<AppConfig> | undefined;
      let savedMedia: DraftMedia | undefined;
      store.get(DRAFT_KEY).onsuccess = (event) => { savedDraft = (event.target as IDBRequest).result; };
      store.get(MEDIA_KEY).onsuccess = (event) => { savedMedia = (event.target as IDBRequest).result; };
      transaction.oncomplete = () => resolve({ draft: savedDraft, media: savedMedia });
      transaction.onerror = () => reject(transaction.error);
    });
    if (!draft) return fallback;
    const restored = {
      ...draft,
      mainPhoto: media?.mainPhoto || draft.mainPhoto,
      galleryPhotos: draft.galleryPhotos?.map((photo) => ({
        ...photo,
        url: media?.galleryPhotos?.[photo.id] || photo.url,
      })),
      customAudioUrl: media?.customAudioUrl || draft.customAudioUrl,
    };
    lastMediaSignature = mediaSignature({
      ...draft,
      mainPhoto: restored.mainPhoto || '',
      galleryPhotos: restored.galleryPhotos || [],
    } as AppConfig);
    return restored;
  } catch {
    return fallback;
  }
};

export const saveCreatorDraft = async (config: AppConfig): Promise<void> => {
  const fallback: Partial<AppConfig> = {
    ...config,
    mainPhoto: isLocalMedia(config.mainPhoto) ? '' : config.mainPhoto,
    galleryPhotos: config.galleryPhotos.map((photo) => ({
      ...photo,
      url: isLocalMedia(photo.url) ? '' : photo.url,
    })),
    customAudioUrl: isLocalMedia(config.customAudioUrl) ? undefined : config.customAudioUrl,
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(fallback));
  } catch {
    // IndexedDB remains the primary draft store.
  }

  if (typeof indexedDB === 'undefined') return;
  const database = await openDraftDatabase();
  const signature = mediaSignature(config);
  const shouldSaveMedia = signature !== lastMediaSignature;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);
    const indexedDraft: Partial<AppConfig> = {
      ...config,
      mainPhoto: isLocalMedia(config.mainPhoto) ? '' : config.mainPhoto,
      galleryPhotos: config.galleryPhotos.map((photo) => ({ ...photo, url: isLocalMedia(photo.url) ? '' : photo.url })),
      customAudioUrl: isLocalMedia(config.customAudioUrl) ? undefined : config.customAudioUrl,
    };
    store.put(indexedDraft, DRAFT_KEY);
    if (shouldSaveMedia) store.put(makeDraftMedia(config), MEDIA_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  lastMediaSignature = signature;
};

export const clearCreatorDraft = async (): Promise<void> => {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(CREATION_ID_KEY);
  } catch {
    // Continue clearing IndexedDB when available.
  }

  if (typeof indexedDB === 'undefined') return;
  try {
    const database = await openDraftDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readwrite');
      transaction.objectStore(OBJECT_STORE).delete(DRAFT_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    // A stale local fallback is removed above; IndexedDB may be unavailable.
  }
};

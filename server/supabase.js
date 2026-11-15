import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'surprise-media';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MAX_GALLERY_PHOTOS = 30;
const MAX_STRING_LENGTH = 4000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const assertSupabase = () => {
  if (!supabase) {
    const error = new Error('Supabase is not configured on the server');
    error.statusCode = 503;
    throw error;
  }
};

const assertString = (value, field, maxLength = MAX_STRING_LENGTH) => {
  if (typeof value !== 'string' || value.length > maxLength) {
    const error = new Error(`${field} is invalid or too long`);
    error.statusCode = 400;
    throw error;
  }
};

const assertRequiredString = (value, field, maxLength = MAX_STRING_LENGTH) => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    const error = new Error(`${field} is required and must be a non-empty string`);
    error.statusCode = 400;
    throw error;
  }
};

const assertMediaReference = (value, field, kind) => {
  if (typeof value !== 'string' || value.length === 0) {
    const error = new Error(`${field} is invalid or too long`);
    error.statusCode = 400;
    throw error;
  }

  if (value.startsWith('data:')) {
    parseDataUrl(value, kind, false);
    return;
  }

  if (value.startsWith('storage:')) {
    if (!/^storage:[^/]+\/[A-Za-z0-9._-]+$/.test(value)) {
      const error = new Error(`${field} is invalid`);
      error.statusCode = 400;
      throw error;
    }
    return;
  }

  if (value.startsWith('/') && !value.startsWith('//') && value.length <= 2048) {
    return;
  }

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || value.length > 2048) {
      throw new Error('invalid media URL');
    }
  } catch {
    const error = new Error(`${field} is invalid`);
    error.statusCode = 400;
    throw error;
  }
};

export const validateConfig = (config) => {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    const error = new Error('Missing surprise configuration');
    error.statusCode = 400;
    throw error;
  }

  ['recipientName', 'senderName', 'mainPhoto'].forEach((field) => {
    if (field === 'mainPhoto') {
      assertMediaReference(config[field], field, 'image');
    } else {
      assertRequiredString(config[field], field);
    }
  });

  ['cakeHeading', 'cakeCelebrationText', 'letterTitle', 'letterGreeting', 'letterClosing'].forEach((field) => {
    assertRequiredString(config[field], field);
  });

  if (config.polaroidText !== undefined) {
    assertString(config.polaroidText, 'polaroidText');
  }

  if (!Array.isArray(config.letterBody) || config.letterBody.length > 12) {
    const error = new Error('letterBody is invalid');
    error.statusCode = 400;
    throw error;
  }
  config.letterBody.forEach((line) => assertString(line, 'letterBody item'));

  if (!Array.isArray(config.galleryPhotos) || config.galleryPhotos.length > MAX_GALLERY_PHOTOS) {
    const error = new Error(`galleryPhotos must contain at most ${MAX_GALLERY_PHOTOS} photos`);
    error.statusCode = 400;
    throw error;
  }

  config.galleryPhotos.forEach((photo) => {
    if (!photo || typeof photo !== 'object') {
      const error = new Error('galleryPhotos contains an invalid photo');
      error.statusCode = 400;
      throw error;
    }
    assertString(photo.id, 'photo.id', 200);
    assertMediaReference(photo.url, 'photo.url', 'image');
    assertString(photo.caption, 'photo.caption', 2048);
    if (photo.date !== undefined) assertString(photo.date, 'photo.date', 200);
  });

  if (config.musicTitle !== undefined) assertString(config.musicTitle, 'musicTitle', 200);
  if (config.customAudioUrl !== undefined) {
    assertMediaReference(config.customAudioUrl, 'customAudioUrl', 'audio');
  }

  if (typeof config.passcode !== 'string' || !/^\d{4,12}$/.test(config.passcode)) {
    const error = new Error('passcode must contain between 4 and 12 digits');
    error.statusCode = 400;
    throw error;
  }

  const serializedSize = Buffer.byteLength(JSON.stringify(config), 'utf8');
  if (serializedSize > 25 * 1024 * 1024) {
    const error = new Error('surprise configuration is too large');
    error.statusCode = 413;
    throw error;
  }
};

const parseDataUrl = (value, kind, decode = true) => {
  if (!value.startsWith('data:')) return null;
  const match = value.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) {
    const error = new Error(`Invalid ${kind} upload`);
    error.statusCode = 400;
    error.code = 'MEDIA_UPLOAD_FAILED';
    throw error;
  }

  const contentType = match[1].toLowerCase();
  const allowedTypes = kind === 'image'
    ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    : ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
  if (!allowedTypes.includes(contentType)) {
    const error = new Error(`Unsupported ${kind} file type`);
    error.statusCode = 400;
    error.code = 'MEDIA_UPLOAD_FAILED';
    throw error;
  }

  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  const encoded = match[2];
  if (!encoded.length || encoded.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(encoded) || encoded.slice(0, -2).includes('=') || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded.slice(-4))) {
    const error = new Error('Invalid upload encoding'); error.statusCode = 400; error.code = 'MEDIA_UPLOAD_FAILED'; throw error;
  }
  const estimatedBytes = Math.floor(encoded.length * 0.75) - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  if (estimatedBytes > maxBytes) {
    const error = new Error(`${kind} file is too large`);
    error.statusCode = 413;
    error.code = 'MEDIA_UPLOAD_FAILED';
    throw error;
  }

  return { buffer: decode ? Buffer.from(encoded, 'base64') : undefined, contentType, size: estimatedBytes };
};

const extensionFor = (contentType) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
}[contentType]);

const uploadDataUrl = async (value, kind, surpriseId, label, requestId) => {
  const parsed = parseDataUrl(value, kind);
  if (!parsed) return value;

  const startedAt = Date.now();
  const storagePath = `${surpriseId}/${label}-${createHash('sha256').update(parsed.buffer).digest('hex').slice(0, 24)}.${extensionFor(parsed.contentType)}`;
  try {
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: false,
    });
    if (error && String(error.statusCode || error.status) !== '409' && error.error !== 'Duplicate') throw error;
    console.info(JSON.stringify({ event: 'creation_stage', requestId, stage: label.startsWith('gallery-') ? 'gallery_upload' : `${label}_upload`, status: 'ok', elapsedMs: Date.now() - startedAt, bytes: parsed.size }));
  } catch (error) {
    console.error(JSON.stringify({ event: 'creation_stage', requestId, stage: label.startsWith('gallery-') ? 'gallery_upload' : `${label}_upload`, status: 'error', elapsedMs: Date.now() - startedAt, bytes: parsed.size, category: error.code || 'storage_error' }));
    error.statusCode = 502;
    error.code = 'MEDIA_UPLOAD_FAILED';
    throw error;
  }
  return `storage:${storagePath}`;
};

const mapWithConcurrency = async (tasks, concurrency) => {
  const results = new Array(tasks.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  });
  await Promise.all(workers);
  return results;
};

export const prepareConfigForStorage = async (inputConfig, surpriseId, requestId) => {
  assertSupabase();
  const clonedConfig = structuredClone(inputConfig);
  const { passcode, ...config } = clonedConfig;
  const references = [config.mainPhoto, config.customAudioUrl, ...config.galleryPhotos.map(photo => photo.url)];
  if (references.some(value => typeof value === 'string' && value.startsWith('storage:') && !value.startsWith('storage:' + surpriseId + '/'))) {
    const error = new Error('Media does not belong to this draft'); error.statusCode = 400; throw error;
  }

  const tasks = [() => uploadDataUrl(config.mainPhoto, 'image', surpriseId, 'main', requestId)];
  const hasAudio = Boolean(config.customAudioUrl);
  if (hasAudio) tasks.push(() => uploadDataUrl(config.customAudioUrl, 'audio', surpriseId, 'audio', requestId));
  const galleryStartIndex = tasks.length;
  config.galleryPhotos.forEach((photo, index) => {
    tasks.push(async () => ({
      ...photo,
      url: await uploadDataUrl(photo.url, 'image', surpriseId, `gallery-${index}`, requestId),
    }));
  });
  const uploaded = await mapWithConcurrency(tasks, 3);

  config.mainPhoto = uploaded[0];
  if (hasAudio) config.customAudioUrl = uploaded[1];
  config.galleryPhotos = uploaded.slice(galleryStartIndex);
  return config;
};

export const uploadDraftMedia = async (creationId, files, requestId) => {
  assertSupabase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creationId || '')
    || !Array.isArray(files) || files.length > 12) {
    const error = new Error('Invalid media upload request');
    error.statusCode = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }
  files.forEach((file) => {
    if (!file || !/^(main|audio|gallery-\d{1,2})$/.test(file.key)
      || !['image', 'audio'].includes(file.kind) || (file.key === 'audio' ? file.kind !== 'audio' : file.kind !== 'image') || typeof file.dataUrl !== 'string') {
      const error = new Error('Invalid media upload request');
      error.statusCode = 400;
      error.code = 'VALIDATION_FAILED';
      throw error;
    }
  });
  // A published link must not permit unauthenticated replacement of its media.
  const { data: published, error: lookupError } = await supabase.from('surprises').select('id').eq('id', creationId).maybeSingle();
  if (lookupError) { lookupError.statusCode = 502; throw lookupError; }
  if (published) { const error = new Error('This surprise is already published. Start a new draft.'); error.statusCode = 409; throw error; }
  const uploaded = await mapWithConcurrency(files.map((file) => async () => ({
    key: file.key,
    reference: await uploadDataUrl(file.dataUrl, file.kind, creationId, file.key, requestId),
  })), 3);
  return uploaded;
};

const resolveMedia = async (value) => {
  if (!value || !value.startsWith('storage:')) return value;
  const storagePath = value.slice('storage:'.length);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60);
  if (error) {
    error.statusCode = 502;
    error.code = 'SURPRISE_SAVE_FAILED';
    throw error;
  }
  return data.signedUrl;
};

export const hydrateConfigForClient = async (storedConfig) => {
  const config = structuredClone(storedConfig || {});
  config.passcode = '';
  config.mainPhoto = await resolveMedia(config.mainPhoto);
  config.customAudioUrl = await resolveMedia(config.customAudioUrl);
  config.galleryPhotos = Array.isArray(config.galleryPhotos) ? await Promise.all(config.galleryPhotos.map(async (photo) => ({
    ...photo,
    url: await resolveMedia(photo?.url),
  }))) : [];
  return config;
};

export const createSurprise = async (config, requestId, requestedId) => {
  assertSupabase();
  const validationStartedAt = Date.now();
  try {
    validateConfig(config);
    console.info(JSON.stringify({ event: 'creation_stage', requestId, stage: 'validation', status: 'ok', elapsedMs: Date.now() - validationStartedAt }));
  } catch (error) {
    console.warn(JSON.stringify({ event: 'creation_stage', requestId, stage: 'validation', status: 'error', elapsedMs: Date.now() - validationStartedAt, category: error.code || (error.statusCode === 400 ? 'invalid_config' : 'validation_error') }));
    throw error;
  }
  const id = requestedId || randomUUID();
  if (requestedId) {
    if (typeof requestedId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedId)) {
      const error = new Error('Invalid creation request ID');
      error.statusCode = 400;
      error.code = 'VALIDATION_FAILED';
      throw error;
    }
    const lookupStartedAt = Date.now();
    const { data: existing, error: lookupError } = await supabase.from('surprises').select('id').eq('id', id).maybeSingle();
    if (lookupError) {
      lookupError.statusCode = 502;
      lookupError.code = 'SUPABASE_LOOKUP_FAILED';
      throw lookupError;
    }
    console.info(JSON.stringify({ event: 'creation_stage', requestId, stage: 'idempotency_lookup', status: 'ok', elapsedMs: Date.now() - lookupStartedAt }));
    if (existing) return existing;
  }

  const mediaStartedAt = Date.now();
  const hashStartedAt = Date.now();
  const [preparedConfig, passcodeHash] = await Promise.all([
    prepareConfigForStorage(config, id, requestId),
    bcrypt.hash(config.passcode, 12).then((hash) => {
      console.info(JSON.stringify({ event: 'creation_stage', requestId, stage: 'passcode_hash', status: 'ok', elapsedMs: Date.now() - hashStartedAt }));
      return hash;
    }),
  ]);
  console.info(JSON.stringify({ event: 'creation_stage', requestId, stage: 'media_uploads', status: 'ok', elapsedMs: Date.now() - mediaStartedAt, imageCount: 1 + config.galleryPhotos.length }));
  const insertStartedAt = Date.now();
  const { data, error } = await supabase
    .from('surprises')
    .insert({
      id,
      recipient_name: config.recipientName,
      sender_name: config.senderName,
      passcode_length: config.passcode.length,
      configuration: preparedConfig,
      passcode_hash: passcodeHash,
    })
    .select('id')
    .single();
  if (error) {
    console.error(JSON.stringify({ event: 'creation_stage', requestId, stage: 'supabase_insert', status: 'error', elapsedMs: Date.now() - insertStartedAt, category: error.code || 'database_error' }));
    if (requestedId) {
      const { data: existing } = await supabase.from('surprises').select('id').eq('id', id).maybeSingle();
      if (existing) return existing;
    }
    error.statusCode = 502;
    error.code = 'SUPABASE_INSERT_FAILED';
    throw error;
  }
  console.info(JSON.stringify({ event: 'creation_stage', requestId, stage: 'supabase_insert', status: 'ok', elapsedMs: Date.now() - insertStartedAt, id: data.id }));
  return data;
};

export const getSurpriseMetadata = async (id) => {
  assertSupabase();
  const { data, error } = await supabase
    .from('surprises')
    .select('id, recipient_name, sender_name, passcode_length, created_at, preview_photo:configuration->>mainPhoto')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    error.statusCode = 502;
    throw error;
  }
  if (!data) return data;
  data.preview_photo = await resolveMedia(data.preview_photo || '/default-surprise.svg');
  return data;
};

export const unlockSurprise = async (id, passcode) => {
  assertSupabase();
  if (typeof passcode !== 'string' || !/^\d{4,12}$/.test(passcode)) {
    const error = new Error('Invalid passcode');
    error.statusCode = 401;
    throw error;
  }

  const { data, error } = await supabase
    .from('surprises')
    .select('configuration, passcode_hash')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    error.statusCode = 502;
    throw error;
  }
  if (!data || typeof data.passcode_hash !== 'string' || !(await bcrypt.compare(passcode, data.passcode_hash))) {
    const invalid = new Error('Incorrect passcode');
    invalid.statusCode = 401;
    throw invalid;
  }
  return hydrateConfigForClient(data.configuration);
};

export const createAdminSession = async (tokenHash, expiresAt) => {
  assertSupabase();
  await supabase.from('admin_sessions').delete().lt('expires_at', new Date().toISOString());
  const { error } = await supabase.from('admin_sessions').insert({ token_hash: tokenHash, expires_at: expiresAt });
  if (error) {
    error.statusCode = 502;
    throw error;
  }
};

export const getAdminSession = async (tokenHash) => {
  assertSupabase();
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) {
    error.statusCode = 502;
    throw error;
  }
  if (!data || Date.parse(data.expires_at) <= Date.now()) return null;
  return data;
};

export const deleteAdminSession = async (tokenHash) => {
  assertSupabase();
  const { error } = await supabase.from('admin_sessions').delete().eq('token_hash', tokenHash);
  if (error) {
    error.statusCode = 502;
    throw error;
  }
};

export const getAdminOverview = async () => {
  assertSupabase();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [total, recent] = await Promise.all([
    supabase.from('surprises').select('id', { count: 'exact', head: true }),
    supabase.from('surprises').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ]);
  if (total.error || recent.error) {
    const error = total.error || recent.error;
    error.statusCode = 502;
    throw error;
  }
  return { totalSurprises: total.count || 0, createdLastSevenDays: recent.count || 0 };
};

export const getAdminSurprises = async () => {
  assertSupabase();
  const { data, error } = await supabase
    .from('surprises')
    .select('id, recipient_name, sender_name, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    error.statusCode = 502;
    throw error;
  }
  return data;
};

export const getAdminAnalytics = async () => {
  assertSupabase();
  const today = new Date();
  const firstDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29));
  const { data, error } = await supabase
    .from('surprises')
    .select('created_at')
    .gte('created_at', firstDay.toISOString());
  if (error) {
    error.statusCode = 502;
    throw error;
  }
  const daily = new Map();
  data.forEach(({ created_at }) => {
    const day = created_at.slice(0, 10);
    daily.set(day, (daily.get(day) || 0) + 1);
  });
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(firstDay.getTime() + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { date, surprises: daily.get(date) || 0 };
  });
};

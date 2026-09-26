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

const assertMediaReference = (value, field, kind) => {
  if (typeof value !== 'string' || value.length === 0) {
    const error = new Error(`${field} is invalid or too long`);
    error.statusCode = 400;
    throw error;
  }

  if (value.startsWith('data:')) {
    parseDataUrl(value, kind);
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

  ['recipientName', 'senderName', 'mainPhoto', 'polaroidText', 'cakeHeading', 'cakeCelebrationText', 'letterTitle', 'letterGreeting', 'letterClosing'].forEach((field) => {
    if (field === 'mainPhoto') {
      assertMediaReference(config[field], field, 'image');
    } else {
      assertString(config[field], field);
    }
  });

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

const parseDataUrl = (value, kind) => {
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

  const buffer = Buffer.from(match[2], 'base64');
  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (buffer.length > maxBytes) {
    const error = new Error(`${kind} file is too large`);
    error.statusCode = 413;
    error.code = 'MEDIA_UPLOAD_FAILED';
    throw error;
  }

  return { buffer, contentType };
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

const uploadDataUrl = async (value, kind, surpriseId, label) => {
  const parsed = parseDataUrl(value, kind);
  if (!parsed) return value;

  const storagePath = `${surpriseId}/${label}-${randomUUID()}.${extensionFor(parsed.contentType)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: false,
  });
  if (error) {
    error.statusCode = 502;
    error.code = 'MEDIA_UPLOAD_FAILED';
    throw error;
  }
  return `storage:${storagePath}`;
};

export const prepareConfigForStorage = async (inputConfig, surpriseId) => {
  assertSupabase();
  const clonedConfig = structuredClone(inputConfig);
  const { passcode, ...config } = clonedConfig;

  const [mainPhoto, customAudioUrl, galleryPhotos] = await Promise.all([
    uploadDataUrl(config.mainPhoto, 'image', surpriseId, 'main'),
    config.customAudioUrl
      ? uploadDataUrl(config.customAudioUrl, 'audio', surpriseId, 'audio')
      : config.customAudioUrl,
    Promise.all(config.galleryPhotos.map(async (photo, index) => ({
      ...photo,
      url: await uploadDataUrl(photo.url, 'image', surpriseId, `gallery-${index}`),
    }))),
  ]);

  config.mainPhoto = mainPhoto;
  config.customAudioUrl = customAudioUrl;
  config.galleryPhotos = galleryPhotos;
  return config;
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
  const config = structuredClone(storedConfig);
  config.passcode = '';
  config.mainPhoto = await resolveMedia(config.mainPhoto);
  config.customAudioUrl = await resolveMedia(config.customAudioUrl);
  config.galleryPhotos = await Promise.all(config.galleryPhotos.map(async (photo) => ({
    ...photo,
    url: await resolveMedia(photo.url),
  })));
  return config;
};

export const createSurprise = async (config) => {
  assertSupabase();
  validateConfig(config);
  const id = randomUUID();
  const [preparedConfig, passcodeHash] = await Promise.all([
    prepareConfigForStorage(config, id),
    bcrypt.hash(config.passcode, 12),
  ]);
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
    error.statusCode = 502;
    throw error;
  }
  return data;
};

export const getSurpriseMetadata = async (id) => {
  assertSupabase();
  const { data, error } = await supabase
    .from('surprises')
    .select('id, recipient_name, sender_name, passcode_length, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    error.statusCode = 502;
    throw error;
  }
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
  if (!data || !(await bcrypt.compare(passcode, data.passcode_hash))) {
    const invalid = new Error('Incorrect passcode');
    invalid.statusCode = 401;
    throw invalid;
  }
  return hydrateConfigForClient(data.configuration);
};

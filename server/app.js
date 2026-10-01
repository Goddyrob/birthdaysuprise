import 'dotenv/config';
import { randomUUID } from 'crypto';
import express from 'express';
import {
  createSurprise,
  getSurpriseMetadata,
  isSupabaseConfigured,
  uploadDraftMedia,
  unlockSurprise,
} from './supabase.js';

const app = express();

app.use((req, res, next) => {
  const suppliedId = req.get('x-request-id');
  req.requestId = suppliedId && /^[0-9a-f-]{36}$/i.test(suppliedId) ? suppliedId : randomUUID();
  res.set('X-Request-ID', req.requestId);
  next();
});

app.use(express.json({ limit: '25mb' }));

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const attempts = new Map();

const allowUnlockAttempt = (key) => {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 10) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true, persistence: isSupabaseConfigured ? 'supabase' : 'unconfigured' });
});

app.post('/api/surprises/media', async (req, res) => {
  const startedAt = Date.now();
  const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  try {
    const media = await uploadDraftMedia(req.body?.creationId, req.body?.files, req.requestId);
    console.info(JSON.stringify({ event: 'creation_stage', requestId: req.requestId, stage: 'media_api', status: 'ok', elapsedMs: Date.now() - startedAt, payloadBytes, mediaCount: media.length }));
    return res.json({ media });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error(JSON.stringify({ event: 'creation_stage', requestId: req.requestId, stage: 'media_api', status: 'error', httpStatus: status, elapsedMs: Date.now() - startedAt, payloadBytes, mediaCount: req.body?.files?.length || 0, category: error.code || 'media_upload_error' }));
    return res.status(status).json({
      code: error.code || 'MEDIA_UPLOAD_FAILED',
      error: status >= 500 ? 'Unable to upload surprise media' : error.message,
    });
  }
});

app.post('/api/surprises', async (req, res) => {
  const startedAt = Date.now();
  const payloadBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  try {
    const result = await createSurprise(req.body?.config, req.requestId, req.body?.creationId);
    console.info(JSON.stringify({ event: 'creation_stage', requestId: req.requestId, stage: 'api_create', status: 'ok', elapsedMs: Date.now() - startedAt, payloadBytes, imageCount: 1 + (req.body?.config?.galleryPhotos?.length || 0), id: result.id }));
    return res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error(JSON.stringify({ event: 'creation_stage', requestId: req.requestId, stage: 'api_create', status: 'error', httpStatus: status, elapsedMs: Date.now() - startedAt, payloadBytes, category: error.code || (status === 400 ? 'validation_error' : 'create_failed') }));
    return res.status(error.statusCode || 500).json({
      code: error.code || (status === 400 ? 'VALIDATION_FAILED' : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'SURPRISE_SAVE_FAILED'),
      error: status >= 500 ? 'Unable to create surprise' : error.message,
    });
  }
});

app.get('/api/surprises/:id', async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(404).json({ error: 'Surprise not found' });
  }

  try {
    const surprise = await getSurpriseMetadata(req.params.id);
    if (!surprise) return res.status(404).json({ error: 'Surprise not found' });
    return res.json({
      id: surprise.id,
      recipientName: surprise.recipient_name,
      senderName: surprise.sender_name,
      createdAt: surprise.created_at,
      passcodeLength: surprise.passcode_length,
      previewPhoto: surprise.preview_photo,
    });
  } catch (error) {
    console.error('Get surprise metadata failed:', error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: status >= 500 ? 'Unable to load surprise' : error.message });
  }
});

app.post('/api/surprises/:id/unlock', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(404).json({ error: 'Surprise not found' });
  const attemptKey = `${req.ip}:${id}`;
  if (!allowUnlockAttempt(attemptKey)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
  }

  try {
    const config = await unlockSurprise(id, req.body?.passcode);
    return res.json({ config });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error('Unlock surprise failed:', error.message);
    const message = status === 401
      ? 'Incorrect passcode'
      : status === 429
        ? error.message
        : status >= 500
          ? 'Unable to unlock surprise'
          : error.message;
    return res.status(status).json({ error: message });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || 400;
  console.error(JSON.stringify({ event: 'creation_stage', requestId: req.requestId, stage: 'request_parse', status: 'error', httpStatus: status, payloadBytes: Number(req.get('content-length')) || 0, category: error.type || 'request_parse_error' }));
  return res.status(status).json({
    code: status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_REQUEST',
    error: status === 413 ? 'Request payload is too large' : 'Invalid request',
  });
});

export default app;
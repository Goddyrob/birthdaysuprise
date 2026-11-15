import 'dotenv/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import {
  createAdminSession,
  createSurprise,
  deleteAdminSession,
  getAdminAnalytics,
  getAdminOverview,
  getAdminSession,
  getAdminSurprises,
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

// Allow the bundled Android frontend to call public surprise endpoints.
// Admin endpoints retain their existing same-origin session policy.
app.use('/api/surprises', (req, res, next) => {
  const origin = req.get('origin');
  const allowed = (process.env.MOBILE_ALLOWED_ORIGINS || 'https://localhost').split(',').map(x => x.trim());
  if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.vary('Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    res.set('Access-Control-Expose-Headers', 'X-Request-ID');
    res.set('Access-Control-Max-Age', '600');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '25mb' }));

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const attempts = new Map();
const ADMIN_COOKIE = 'dearli_admin_session';
const ADMIN_SESSION_TTL = 8 * 60 * 60 * 1000;

const getAdminToken = (req) => {
  const cookie = req.get('cookie') || '';
  const value = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  return value ? value.slice(ADMIN_COOKIE.length + 1) : null;
};

const hashAdminToken = (token) => createHash('sha256').update(token).digest('hex');
const isSecureRequest = (req) => process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || req.secure || req.get('x-forwarded-proto') === 'https';
const setAdminCookie = (req, res, token, maxAge) => {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
};
const clearAdminCookie = (req, res) => {
  res.clearCookie(ADMIN_COOKIE, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'strict',
    path: '/',
  });
};

const requireAdmin = async (req, res, next) => {
  const token = getAdminToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const session = await getAdminSession(hashAdminToken(token));
    if (!session) {
      clearAdminCookie(req, res);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.adminTokenHash = hashAdminToken(token);
    req.adminExpiresAt = session.expires_at;
    return next();
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: 'Unable to verify admin session' });
  }
};

const adminLoginAttempts = new Map();
const allowAdminLogin = (ip) => {
  const now = Date.now();
  const recent = (adminLoginAttempts.get(ip) || []).filter((timestamp) => now - timestamp < 15 * 60_000);
  if (recent.length >= 10) {
    adminLoginAttempts.set(ip, recent);
    return false;
  }
  recent.push(now);
  adminLoginAttempts.set(ip, recent);
  return true;
};

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

app.use('/api/admin', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, persistence: isSupabaseConfigured ? 'supabase' : 'unconfigured' });
});

app.post('/api/admin/login', async (req, res) => {
  if (!allowAdminLogin(req.ip)) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash || typeof req.body?.password !== 'string') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  let validPassword = false;
  try {
    validPassword = await bcrypt.compare(req.body.password, passwordHash);
  } catch {
    return res.status(503).json({ error: 'Admin authentication is not configured correctly' });
  }
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

  try {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL).toISOString();
    await createAdminSession(hashAdminToken(token), expiresAt);
    setAdminCookie(req, res, token, ADMIN_SESSION_TTL);
    return res.json({ authenticated: true, expiresAt });
  } catch (error) {
    if (error?.code === 'PGRST205' || /admin_sessions/i.test(String(error?.message || ''))) {
      return res.status(503).json({
        error: 'Admin setup is incomplete. Run the SQL in supabase/schema.sql before enabling owner access.',
      });
    }
    return res.status(error.statusCode || 503).json({ error: 'Unable to create admin session' });
  }
});

app.post('/api/admin/logout', requireAdmin, async (req, res) => {
  try {
    await deleteAdminSession(req.adminTokenHash);
    clearAdminCookie(req, res);
    return res.status(204).end();
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: 'Unable to end admin session' });
  }
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({ authenticated: true, expiresAt: req.adminExpiresAt });
});

app.get('/api/admin/overview', requireAdmin, async (req, res) => {
  try {
    return res.json(await getAdminOverview());
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: 'Unable to load admin overview' });
  }
});

app.get('/api/admin/surprises', requireAdmin, async (req, res) => {
  try {
    return res.json({ surprises: await getAdminSurprises() });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: 'Unable to load surprises' });
  }
});

app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    return res.json({ daily: await getAdminAnalytics() });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: 'Unable to load analytics' });
  }
});

app.get('/api/admin/errors', requireAdmin, (req, res) => {
  res.json({ available: false, items: [], source: 'deployment logs' });
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
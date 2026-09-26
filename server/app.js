import 'dotenv/config';
import express from 'express';
import {
  createSurprise,
  getSurpriseMetadata,
  isSupabaseConfigured,
  unlockSurprise,
} from './supabase.js';

const app = express();

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

app.post('/api/surprises', async (req, res) => {
  try {
    const result = await createSurprise(req.body?.config);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create surprise failed:', error.message);
    return res.status(error.statusCode || 500).json({
      code: error.code || 'SURPRISE_SAVE_FAILED',
      error: error.statusCode ? error.message : 'Unable to create surprise',
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
    });
  } catch (error) {
    console.error('Get surprise metadata failed:', error.message);
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Unable to load surprise' });
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
    return res.status(status).json({ error: status === 401 ? 'Incorrect passcode' : error.message });
  }
});

export default app;
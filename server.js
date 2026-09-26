import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './server/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (error) => {
    if (error && !res.headersSent) res.status(404).send('App build not found. Run npm run build first.');
  });
});

app.listen(port, () => {
  console.log(`Surprise API listening on http://localhost:${port}`);
});

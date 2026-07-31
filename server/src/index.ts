import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { toNodeHandler } from 'better-auth/node';

import { auth, BETTER_AUTH_URL } from './lib/auth.js';
import { requireAuth } from './middleware/require-auth.js';

const app = express();

app.use(cors({ origin: BETTER_AUTH_URL, credentials: true }));

// Must come before express.json(). Better Auth reads the raw request body
// itself; letting the JSON parser consume it first leaves auth requests hanging.
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.auth);
});

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});

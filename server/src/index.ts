import type { Response } from 'express';

import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';

import type { HealthResponse } from '@core/api-types.js';
import { serverMessages } from '@core/messages.js';

import { auth } from './lib/auth.js';
import { env } from './lib/env.js';

const app = express();

app.use(cors({ origin: env.BETTER_AUTH_URL, credentials: true }));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res: Response<HealthResponse>) => {
  res.json({ status: 'ok' });
});

app.listen(env.PORT, () => {
  console.log(serverMessages.listening(env.PORT));
});

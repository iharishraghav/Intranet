import type { Response } from 'express';

import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';

import type { HealthResponse } from 'core/api-types.js';
import { serverMessages } from 'core/messages.js';

import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { apiRateLimit, authRateLimit } from './middleware/rate-limit.js';

const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors({ origin: env.BETTER_AUTH_URL, credentials: true }));

app.use('/api/auth', authRateLimit);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use('/api', apiRateLimit);

app.use(express.json());

app.get('/api/health', (_req, res: Response<HealthResponse>) => {
  res.json({ status: 'ok' });
});

app.listen(env.PORT, () => {
  console.log(serverMessages.listening(env.PORT));
});

import type { RequestHandler } from 'express';

import { rateLimit } from 'express-rate-limit';

import { apiMessages } from 'core/messages.js';

import { env } from '../lib/env.js';

const isProduction = env.NODE_ENV === 'production';

const passThrough: RequestHandler = (_req, _res, next) => {
  next();
};

function createLimiter(windowMs: number, limit: number): RequestHandler {
  if (!isProduction) {
    return passThrough;
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: apiMessages.tooManyRequests },
  });
}

export const apiRateLimit = createLimiter(15 * 60 * 1000, 300);

export const authRateLimit = createLimiter(15 * 60 * 1000, 20);

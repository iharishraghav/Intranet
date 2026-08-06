import type { NextFunction, Request, Response } from 'express';

import { fromNodeHeaders } from 'better-auth/node';

import { apiMessages } from '@core/messages.js';

import { auth } from '../lib/auth.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session) {
    res.status(401).json({ error: apiMessages.unauthorized });
    return;
  }

  req.auth = session;
  next();
}

import type { NextFunction, Request, Response } from 'express';

import { fromNodeHeaders } from 'better-auth/node';

import { Role } from '../generated/prisma/client.js';
import { auth, type Session } from '../lib/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: Session;
    }
  }
}

/**
 * Rejects unauthenticated requests and attaches the session to `req.auth`.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.auth = session;
  next();
}

/**
 * Rejects anyone who is not an admin. Runs `requireAuth` first, so routes only
 * need this one.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.auth?.user.role !== Role.Admin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  });
}

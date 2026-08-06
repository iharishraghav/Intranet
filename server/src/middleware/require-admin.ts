import type { NextFunction, Request, Response } from 'express';

import { apiMessages } from 'core/messages.js';

import { Role } from '../generated/prisma/client.js';
import { requireAuth } from './require-auth.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.auth?.user.role !== Role.Admin) {
      res.status(403).json({ error: apiMessages.forbidden });
      return;
    }

    next();
  });
}

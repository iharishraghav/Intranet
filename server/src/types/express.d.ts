import type { auth } from '../lib/auth.js';

type Session = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      auth?: Session;
    }
  }
}

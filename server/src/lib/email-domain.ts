import { env } from './env.js';

export function isAllowedEmailDomain(email: string): boolean {
  return email.split('@')[1]?.toLowerCase() === env.ALLOWED_EMAIL_DOMAIN;
}

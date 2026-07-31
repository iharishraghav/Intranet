// dotenv must load before this file and ../db.js read process.env. This file is
// also loaded directly by the Better Auth CLI (`npm run auth:generate`), outside
// of src/index.ts, so it cannot rely on the entrypoint having done this.
import 'dotenv/config';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';

import { prisma } from '../db.js';
import { Role } from '../generated/prisma/client.js';

// Read eagerly at import time so a misconfigured deployment fails at boot with a
// named variable rather than at the first sign-in attempt with an opaque OAuth
// error.
function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    throw new Error(`${name} is not set. Copy server/.env.example to server/.env.`);
  }

  return value.trim();
}

const BETTER_AUTH_SECRET = requireEnv('BETTER_AUTH_SECRET');
const ZOHO_ACCOUNTS_URL = requireEnv('ZOHO_ACCOUNTS_URL').replace(/\/+$/, '');
const ZOHO_CLIENT_ID = requireEnv('ZOHO_CLIENT_ID');
const ZOHO_CLIENT_SECRET = requireEnv('ZOHO_CLIENT_SECRET');

// Also the CORS origin in src/index.ts -- the browser talks to the Vite dev
// server, which proxies /api here.
export const BETTER_AUTH_URL = requireEnv('BETTER_AUTH_URL');

const ALLOWED_EMAIL_DOMAINS: readonly string[] = Object.freeze(
  (process.env['ALLOWED_EMAIL_DOMAINS'] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== ''),
);

/**
 * Whether an address belongs to one of the configured organization domains.
 *
 * Shared by the sign-in hook below and the provisioning seed so the rule has a
 * single definition. An empty ALLOWED_EMAIL_DOMAINS denies everything rather
 * than allowing everything -- an unset variable should not silently open the
 * intranet to any Zoho account.
 */
export function isAllowedEmail(email: string): boolean {
  const at = email.lastIndexOf('@');

  if (at === -1) {
    return false;
  }

  const domain = email.slice(at + 1).toLowerCase();

  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

// Deliberately vague. A rejected sign-in must not reveal whether the address is
// unprovisioned, out-of-domain, or simply unknown -- that would let anyone with
// a Zoho account enumerate who works here.
const ACCESS_DENIED = 'Access denied. Contact your administrator.';

export const auth = betterAuth({
  appName: 'Intranet',
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  // The browser only ever talks to the Vite dev server, which proxies /api here.
  trustedOrigins: [BETTER_AUTH_URL],

  user: {
    additionalFields: {
      // Values come from the generated Role enum, so the accepted set can never
      // drift from the database column.
      role: {
        type: [Role.User, Role.Admin],
        required: false,
        defaultValue: Role.User,
        // Keeps `role` out of any request body -- it is set at provisioning
        // time by prisma/seed.ts, never by the client.
        input: false,
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Required. Users are provisioned into the user table before they ever
      // sign in, so the Zoho login must link onto that existing row. Without
      // this, first sign-in fails with account_not_linked.
      trustedProviders: ['zoho'],
      // Lets the seed write a placeholder name that Zoho replaces with the
      // real display name on first sign-in. Email is never changed by a link.
      updateUserInfoOnLink: true,
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'zoho',
          discoveryUrl: `${ZOHO_ACCOUNTS_URL}/.well-known/openid-configuration`,
          clientId: ZOHO_CLIENT_ID,
          clientSecret: ZOHO_CLIENT_SECRET,
          scopes: ['openid', 'email', 'profile'],
          pkce: true,
          // No self-service accounts: the user table is an allowlist.
          disableSignUp: true,
        },
      ],
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        // Nothing may create a user through the auth flow. This backs up the
        // provider's disableSignUp so a future provider, or a config slip,
        // cannot quietly re-enable self-service registration. Provisioning
        // writes through Prisma directly and does not pass through here.
        before: () => {
          throw new APIError('FORBIDDEN', { message: ACCESS_DENIED });
        },
      },
    },
    session: {
      create: {
        // Domain check on every sign-in, not just the first, so an address that
        // was provisioned by mistake or has since left the organization cannot
        // keep authenticating.
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });

          if (!user || !isAllowedEmail(user.email)) {
            throw new APIError('FORBIDDEN', { message: ACCESS_DENIED });
          }

          return { data: session };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

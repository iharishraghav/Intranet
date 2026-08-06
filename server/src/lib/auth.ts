import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';

import { apiMessages } from 'core/messages.js';

import { prisma } from '../db.js';
import { Role } from '../generated/prisma/client.js';
import { isAllowedEmailDomain } from './email-domain.js';
import { env } from './env.js';

export const auth = betterAuth({
  appName: 'Intranet',
  basePath: '/api/auth',

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  trustedOrigins: [env.BETTER_AUTH_URL],

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: Role.User,
        input: false,
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['zoho'],
      updateUserInfoOnLink: true,
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'zoho',
          discoveryUrl: `${env.ZOHO_ACCOUNTS_URL}/.well-known/openid-configuration`,
          clientId: env.ZOHO_CLIENT_ID,
          clientSecret: env.ZOHO_CLIENT_SECRET,
          scopes: ['openid', 'email', 'profile'],
          pkce: true,
          disableSignUp: true,
        },
      ],
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        before: () => {
          throw new APIError('FORBIDDEN', {
            message: apiMessages.accessDenied,
          });
        },
      },
    },

    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });

          if (!user || !isAllowedEmailDomain(user.email)) {
            throw new APIError('FORBIDDEN', {
              message: apiMessages.accessDenied,
            });
          }
        },
      },
    },
  },
});
import 'dotenv/config';

import * as z from 'zod';

import { serverMessages } from '@core/messages.js';

const envSchema = z.object({
  PORT: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().positive().default(3000),
  ),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
  ZOHO_ACCOUNTS_URL: z.url({ protocol: /^https?$/ }),
  ZOHO_CLIENT_ID: z.string().min(10),
  ZOHO_CLIENT_SECRET: z.string().min(10),
  ALLOWED_EMAIL_DOMAIN: z.string().min(5).toLowerCase(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(serverMessages.invalidEnv(z.prettifyError(parsed.error)));
}

export const env = parsed.data;

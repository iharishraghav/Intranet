import { randomUUID } from 'node:crypto';

import * as z from 'zod';

import { seedMessages } from '@core/messages.js';

import { prisma } from 'src/db.js';
import { Role } from 'src/generated/prisma/client.js';
import { isAllowedEmailDomain } from 'src/lib/email-domain.js';

const seedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z
    .email()
    .refine(isAllowedEmailDomain, seedMessages.emailOutsideAllowedDomain),
  SEED_ADMIN_NAME: z.string().min(1),
});

async function seedAdmin() {
  const parsed = seedEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(seedMessages.invalidEnv(z.prettifyError(parsed.error)));
  }

  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_NAME: name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(seedMessages.adminExists(email));
    return;
  }

  const now = new Date();

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name,
      email,
      emailVerified: false,
      role: Role.Admin,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(seedMessages.adminCreated(email));
}

try {
  await seedAdmin();
} catch (error) {
  console.error(seedMessages.adminFailed, error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

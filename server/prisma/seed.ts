import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { Role } from '../src/generated/prisma/client.js';
import { prisma } from '../src/db.js';
import { isAllowedEmail } from '../src/lib/auth.js';

type SeedUser = {
  email: string;
  role: Role;
};

const USERS: SeedUser[] = [{ email: 'harish.raghav@dahnay.com', role: Role.Admin }];

async function seedUser({ email, role }: SeedUser): Promise<void> {
  // A user on a domain outside ALLOWED_EMAIL_DOMAINS would be created here and
  // then refused at sign-in by the session hook. Fail loudly now instead.
  if (!isAllowedEmail(email)) {
    throw new Error(
      `${email} is not on an allowed domain. Add its domain to ALLOWED_EMAIL_DOMAINS.`,
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  await prisma.user.upsert({
    where: { email },
    // The name is a placeholder. Better Auth overwrites it with the real Zoho
    // display name on first sign-in, via accountLinking.updateUserInfoOnLink.
    //
    // emailVerified is true because Zoho SSO is the only way in and there is no
    // email-based flow to verify against; linking never mutates it afterwards.
    create: {
      id: randomUUID(),
      email,
      name: email.slice(0, email.lastIndexOf('@')),
      emailVerified: true,
      role,
      updatedAt: new Date(),
    },
    update: { role, updatedAt: new Date() },
  });

  console.log(`  ${existing ? 'updated' : 'created'} ${email} (${role})`);
}

try {
  console.log('Seeding users...');

  for (const user of USERS) {
    await seedUser(user);
  }
} finally {
  await prisma.$disconnect();
}

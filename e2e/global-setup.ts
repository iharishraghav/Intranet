import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse } from 'dotenv';

const serverDir = fileURLToPath(new URL('../server', import.meta.url));
const testEnvPath = fileURLToPath(new URL('.env.test', import.meta.url));

export default function globalSetup() {
  let testEnv: Record<string, string>;

  try {
    testEnv = parse(readFileSync(testEnvPath));
  } catch {
    throw new Error(
      'Missing e2e/.env.test — copy e2e/.env.test.example and fill it in before running e2e tests.',
    );
  }

  const env = {
    ...process.env,
    ...testEnv,
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'Yes',
  };

  console.log(`Resetting the test database at ${testEnv.DATABASE_URL}`);
  execSync('npx prisma migrate reset --force', { cwd: serverDir, stdio: 'inherit', env });

  console.log('Seeding the test database');
  execSync('npx tsx prisma/seed.ts', { cwd: serverDir, stdio: 'inherit', env });
}

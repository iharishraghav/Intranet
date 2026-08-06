import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse } from 'dotenv';

const testEnvPath = fileURLToPath(new URL('.env.test', import.meta.url));

function readTestEnv(): Record<string, string> {
  try {
    return parse(readFileSync(testEnvPath));
  } catch {
    throw new Error(
      'Missing e2e/.env.test — copy e2e/.env.test.example and fill it in before running e2e tests.',
    );
  }
}

export const testEnv = readTestEnv();

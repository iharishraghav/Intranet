import 'dotenv/config';
import { defineConfig } from 'prisma/config';

declare const process: { env: { DATABASE_URL?: string } };

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('Please ensure DATABASE_URL is configured in your .env file.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url },
});

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL || '';
const dbToken = process.env.TURSO_AUTH_TOKEN || '';

const isLocal = !dbUrl || !dbToken || dbToken === 'your_token_here';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  // Use 'sqlite' dialect if credentials are missing to allow local testing
  dialect: isLocal ? 'sqlite' : 'turso',
  dbCredentials: {
    url: isLocal ? `file:${path.join(process.cwd(), 'local.db')}` : dbUrl,
    authToken: isLocal ? undefined : dbToken,
  },
  strict: false,
} satisfies Config;

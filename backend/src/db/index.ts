import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("CRITICAL: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.");
  throw new Error('Database environment variables are missing.');
}

console.log(`Connecting to database: ${process.env.TURSO_DATABASE_URL.substring(0, 15)}...`);

// Render users frequently paste quotes by mistake. Strip them to prevent URL_INVALID errors.
const safeUrl = process.env.TURSO_DATABASE_URL.replace(/['"]/g, '').trim();
const safeToken = process.env.TURSO_AUTH_TOKEN.replace(/['"]/g, '').trim();

const client = createClient({
  url: safeUrl,
  authToken: safeToken,
});

export const db = drizzle(client, { schema });

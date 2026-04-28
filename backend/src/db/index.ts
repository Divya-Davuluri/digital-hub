import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const isCI = process.env.CI === "true";
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

let client: any;

if (!dbUrl || !dbToken) {
  if (isCI) {
    console.log("Skipping DB connection in CI mode");
    // Use a dummy client for CI to prevent crashes during initialization/build
    client = createClient({ url: "libsql://ci-dummy-url" });
  } else {
    console.error("CRITICAL: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.");
    throw new Error('Database environment variables are missing.');
  }
} else {
  console.log(`Connecting to database: ${dbUrl.substring(0, 15)}...`);
  // Render users frequently paste quotes by mistake. Strip them to prevent URL_INVALID errors.
  const safeUrl = dbUrl.replace(/['"]/g, '').trim();
  const safeToken = dbToken.replace(/['"]/g, '').trim();

  client = createClient({
    url: safeUrl,
    authToken: safeToken,
  });
}

export const db = drizzle(client, { schema });

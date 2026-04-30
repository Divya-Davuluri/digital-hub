import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

let client: any;

// LOGIC: Use Turso if credentials exist, otherwise fallback to local SQLite for development
if (dbUrl && dbToken && dbToken !== 'your_token_here') {
  console.log(`📡 [DB] CONNECTING TO TURSO CLOUD...`);
  
  const safeUrl = dbUrl.replace(/['"]/g, '').trim();
  const safeToken = dbToken.replace(/['"]/g, '').trim();

  client = createClient({
    url: safeUrl,
    authToken: safeToken,
  });
} else {
  // CRITICAL: Fail in production if Turso is missing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ FATAL DB ERROR: Turso credentials missing in production environment!');
  }

  // FALLBACK: Use local SQLite file 'local.db' inside the backend folder
  const localDbPath = `file:${path.join(process.cwd(), 'local.db')}`;
  console.warn(`⚠️ [DB] LOCAL FALLBACK: ${localDbPath}`);
  
  client = createClient({
    url: localDbPath,
  });
}

export const db = drizzle(client, { schema });

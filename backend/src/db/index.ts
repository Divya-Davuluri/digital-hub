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
  console.log(`📡 ATTEMPTING TURSO CONNECTION:`);
  console.log(`🔗 URL: ${dbUrl}`);
  console.log(`🔑 TOKEN: ${dbToken.substring(0, 15)}...`);
  
  const safeUrl = dbUrl.replace(/['"]/g, '').trim();
  const safeToken = dbToken.replace(/['"]/g, '').trim();

  client = createClient({
    url: safeUrl,
    authToken: safeToken,
  });
} else {
  // FALLBACK: Use local SQLite file 'local.db' inside the backend folder
  const localDbPath = `file:${path.join(process.cwd(), 'local.db')}`;
  console.warn(`⚠️  TURSO CREDENTIALS MISSING: Falling back to local database: ${localDbPath}`);
  console.warn(`👉 To use Turso, update TURSO_AUTH_TOKEN in backend/.env`);
  
  client = createClient({
    url: localDbPath,
  });
}

export const db = drizzle(client, { schema });

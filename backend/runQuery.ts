import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main() {
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbToken) {
    console.error("No Turso URL or token");
    process.exit(1);
  }

  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    await client.execute("ALTER TABLE sessions ADD COLUMN workspace_id TEXT;");
    console.log("Success");
  } catch (err: any) {
    if (err.message && err.message.includes("duplicate column name")) {
      console.log("Column already exists");
    } else {
      console.error(err);
    }
  }
}

main();

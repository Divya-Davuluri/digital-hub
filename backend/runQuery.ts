import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

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
    await client.execute(`
      UPDATE tenant_branding
      SET secondary_color = '#10b981'
      WHERE secondary_color IS NULL
      OR secondary_color = ''
      OR secondary_color = '#000000';
    `);
    console.log("UPDATE tenant_branding success");
  } catch (err: any) {
    console.error(err);
  }
}

main();

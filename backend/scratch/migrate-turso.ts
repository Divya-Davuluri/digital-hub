import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  });

  const queries = [
    `ALTER TABLE "User" ADD COLUMN "facebookId" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "is2FAEnabled" BOOLEAN NOT NULL DEFAULT 0`,
    `ALTER TABLE "User" ADD COLUMN "twoFASecret" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "backupCodes" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "reset2FAToken" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "reset2FAExpiry" DATETIME`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_facebookId_key" ON "User"("facebookId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_reset2FAToken_key" ON "User"("reset2FAToken")`
  ];

  console.log('Running migrations on Turso...');
  for (const query of queries) {
    try {
      console.log(`Executing: ${query}`);
      await libsql.execute(query);
    } catch (err: any) {
      if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
        console.log(`  [SKIP] ${err.message}`);
      } else {
        console.error(`  [ERROR] ${err.message}`);
      }
    }
  }
  console.log('Migration finished!');
}

migrate();

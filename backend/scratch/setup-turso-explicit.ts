import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  });

  const sqls = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "password" TEXT,
      "isVerified" BOOLEAN NOT NULL DEFAULT false,
      "otp" TEXT,
      "otpExpiry" DATETIME,
      "googleId" TEXT,
      "facebookId" TEXT,
      "is2FAEnabled" BOOLEAN NOT NULL DEFAULT false,
      "twoFASecret" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_facebookId_key" ON "User"("facebookId")`
  ];

  try {
    console.log('Executing SQL on Turso...');
    for (const sql of sqls) {
      await libsql.execute(sql);
    }
    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

setup();

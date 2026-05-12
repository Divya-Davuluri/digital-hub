import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetPass() {
  const hash = await bcrypt.hash('password123', 12);
  await db.update(users).set({ password: hash }).where(eq(users.email, 'testclient1@gmail.com'));
  console.log("Password reset!");
  process.exit(0);
}

resetPass();

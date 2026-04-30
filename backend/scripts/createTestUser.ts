import { db } from '../src/db';
import { users, tenants } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { eq } from 'drizzle-orm';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createAdmin() {
  const email = 'admin@demo.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('Cleaning up existing user if any...');
  await db.delete(users).where(eq(users.email, email));

  // Create Tenant first
  const tenantId = uuidv4();
  await db.insert(tenants).values({
    id: tenantId,
    name: 'Demo Agency',
    subdomain: 'demo-agency-' + Math.random().toString(36).substring(7)
  }).onConflictDoNothing();

  const userId = uuidv4();
  
  try {
    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      name: 'Demo Admin',
      role: 'admin',
      tenantId: tenantId
    });
    console.log(`✅ Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (err: any) {
    console.error('❌ Failed to create admin:', err);
  }
  process.exit(0);
}

createAdmin();

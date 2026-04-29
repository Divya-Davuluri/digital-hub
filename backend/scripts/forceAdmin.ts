import { db } from '../src/db';
import { users, tenants } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
  console.log("🚀 FORCE SEEDING ADMIN ACCOUNT...");

  const email = "admin@demo.com";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const userId = uuidv4();
  const tenantId = uuidv4();

  try {
    // 1. Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      console.log("⚠️  Admin user already exists. Updating password to 'admin123'...");
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, existing.id));
      console.log("✅ Password updated.");
      return;
    }

    // 2. Create Tenant
    await db.insert(tenants).values({
      id: tenantId,
      name: "Demo Agency",
      subdomain: "demo-" + Math.random().toString(36).substring(7)
    });

    // 3. Create Admin User
    await db.insert(users).values({
      id: userId,
      tenantId,
      name: "Demo Admin",
      email,
      password: hashedPassword,
      role: 'admin',
      provider: 'local'
    });

    console.log("✅ SUCCESS! Admin account created.");
    console.log("📧 Email: admin@demo.com");
    console.log("🔑 Password: admin123");

  } catch (error) {
    console.error("❌ SEEDING FAILED:", error);
  }
}

seedAdmin();

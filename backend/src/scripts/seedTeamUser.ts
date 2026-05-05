import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';

async function seedTeamUser() {
  try {
    console.log('🚀 Starting demo user seeding...');

    // 1. Get admin tenant_id
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'admin'),
    });
    
    let tenantId = adminUser?.tenantId;
    
    if (!tenantId) {
      console.log('⚠️ No admin found! Creating a default tenant ID...');
      tenantId = randomUUID();
    }

    const demoAccounts = [
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: 'Admin@123456',
        role: 'admin' as const,
      },
      {
        name: 'Team Member',
        email: 'team@demo.com',
        password: 'Team@123456',
        role: 'team' as const,
      },
      {
        name: 'Client User',
        email: 'client@demo.com',
        password: 'Client@123456',
        role: 'client' as const,
      }
    ];

    for (const account of demoAccounts) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, account.email),
      });
      
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      if (existingUser) {
        console.log(`🔄 Updating password for ${account.email}...`);
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.email, account.email));
      } else {
        console.log(`🆕 Creating user ${account.email}...`);
        await db.insert(users).values({
          id: randomUUID(),
          tenantId: tenantId,
          name: account.name,
          email: account.email,
          password: hashedPassword,
          role: account.role,
          provider: 'local',
          twoFactorEnabled: 0,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ Demo users seeded successfully!');
    console.log('-----------------------------------');
    console.log('Team Email: team@demo.com, Password: Team@123456');
    console.log('Admin Email: admin@demo.com, Password: Admin@123456');
    console.log('Client Email: client@demo.com, Password: Client@123456');
    console.log('-----------------------------------');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

seedTeamUser();

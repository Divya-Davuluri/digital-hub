import { db } from '../src/db';
import { clients, users, tenants } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting comprehensive seeding...');

  try {
    let tenantId: string;
    let userId: string;

    // 1. Check for existing user/tenant
    const existingUser = await db.query.users.findFirst();
    
    if (!existingUser) {
      console.log('📡 Database empty. Creating default Administrator and Tenant...');
      
      tenantId = uuidv4();
      userId = uuidv4();
      const subdomain = 'demo-agency-' + Math.random().toString(36).substring(2, 7);

      // Create Default Tenant
      await db.insert(tenants).values({
        id: tenantId,
        name: 'Digital Agency Hub',
        subdomain,
      });

      // Create Default Admin User (Password: admin123)
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await db.insert(users).values({
        id: userId,
        tenantId,
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'admin',
      });

      console.log('✅ Created Demo Account: admin@demo.com / admin123');
    } else {
      tenantId = existingUser.tenantId!;
      console.log(`📡 Using existing Tenant ID: ${tenantId}`);
    }

    const sampleClients = [
      { name: 'Puma', email: 'puma@gmail.com' },
      { name: 'Tata', email: 'tata@gmail.com' },
      { name: 'Nike', email: 'nike@gmail.com' },
      { name: 'Amazon', email: 'amazon@gmail.com' },
      { name: 'Flipkart', email: 'flipkart@gmail.com' },
    ];

    for (const client of sampleClients) {
      // Check if client already exists to avoid duplicates
      const existing = await db.query.clients.findFirst({
        where: (clients, { and, eq }) => and(eq(clients.name, client.name), eq(clients.tenantId, tenantId))
      });

      if (!existing) {
        await db.insert(clients).values({
          id: uuidv4(),
          tenantId,
          name: client.name,
          email: client.email,
          status: 'active',
        });
        console.log(`✅ Added: ${client.name}`);
      } else {
        console.log(`⏩ Skipping: ${client.name} (Already exists)`);
      }
    }

    console.log('✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

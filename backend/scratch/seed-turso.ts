import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  });

  const email = 'admin@agency.com';
  const plainPassword = 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  // Need to generate a unique ID, we can use a timestamp or a simple string for seeding
  const id = `user_${Date.now()}`;

  try {
    console.log('Seeding admin user to Turso...');
    
    // Check if user already exists
    const checkUser = await libsql.execute({
      sql: 'SELECT id FROM "User" WHERE email = ?',
      args: [email]
    });
    
    if (checkUser.rows.length > 0) {
      console.log('Admin user already exists!');
      return;
    }

    await libsql.execute({
      sql: 'INSERT INTO "User" (id, email, name, password, isVerified, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      args: [id, email, 'Admin User', hashedPassword, true]
    });
    console.log('Admin user seeded successfully!');
    console.log('Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${plainPassword}`);
  } catch (error) {
    console.error('Error seeding user:', error);
  }
}

seed();

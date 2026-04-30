import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUser() {
  const email = 'admin@demo.com';
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  
  if (user) {
    console.log('✅ User found:', user.email);
    console.log('Role:', user.role);
    console.log('TenantID:', user.tenantId);
    console.log('Password exists:', !!user.password);
  } else {
    console.log('❌ User NOT found:', email);
    
    // List all users to see what's there
    const allUsers = await db.query.users.findMany();
    console.log('Total users in DB:', allUsers.length);
    allUsers.forEach(u => console.log(` - ${u.email} (${u.role})`));
  }
  process.exit(0);
}

checkUser();

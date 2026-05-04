import { db } from '../src/db';
import { users, clients } from '../src/db/schema';
import { eq, or, like } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const tenantId = '9142f583-09e6-4df9-b4a2-bcab048799b5';
  const user = await db.query.users.findFirst({
    where: or(like(users.name, '%sravani%'), like(users.email, '%sravani%'))
  });
  console.log('User found:', user);
  if (user) {
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.email, user.email)
    });
    if (!existingClient) {
      await db.insert(clients).values({
        id: user.id, // Using user id as client id for simplicity
        tenantId,
        name: user.name,
        email: user.email,
        status: 'active'
      });
      console.log('Inserted client for user', user.name);
    } else {
      console.log('Client already exists', existingClient);
    }
  }
}

run().catch(console.error).then(() => process.exit(0));

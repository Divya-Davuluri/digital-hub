import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function checkUser() {
  const email = 'anjuuser123@gmail.com';
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (user) {
    console.log('✅ USER FOUND:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('❌ USER NOT FOUND');
  }
  process.exit(0);
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});

import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
  const allUsers = await db.select().from(users);
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import { db } from '../src/config/database';
import { reportRequests } from '../src/config/schema';

async function check() {
  const reqs = await db.select().from(reportRequests);
  console.log("All requests:");
  console.dir(reqs, { depth: null });
  process.exit(0);
}

check();

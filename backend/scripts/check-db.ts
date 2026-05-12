import { db } from '../src/db';
import { tenants, users } from '../src/db/schema';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  const t = await db.select().from(tenants);
  console.log("Tenants:", t);
  const u = await db.select().from(users);
  console.log("Users:", u);
  process.exit(0);
}

check();

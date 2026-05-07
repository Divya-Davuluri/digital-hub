
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkData() {
  try {
    const workspaces = await db.all(sql`SELECT * FROM workspaces LIMIT 5`);
    console.log('Workspaces Sample:', JSON.stringify(workspaces, null, 2));
    
    const clients = await db.all(sql`SELECT * FROM clients LIMIT 5`);
    console.log('Clients Sample:', JSON.stringify(clients, null, 2));
  } catch (err) {
    console.error('Error checking data:', err);
  }
}

checkData();


import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    const tableInfo = await db.all(sql`PRAGMA table_info(clients)`);
    console.log('Clients Table Info:', JSON.stringify(tableInfo, null, 2));
    
    const workspaceInfo = await db.all(sql`PRAGMA table_info(workspaces)`);
    console.log('Workspaces Table Info:', JSON.stringify(workspaceInfo, null, 2));
    
    const usersInfo = await db.all(sql`PRAGMA table_info(users)`);
    console.log('Users Table Info:', JSON.stringify(usersInfo, null, 2));
    
  } catch (err) {
    console.error('Error checking schema:', err);
  }
}

checkSchema();

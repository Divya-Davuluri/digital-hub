
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkCampaigns() {
  try {
    const data: any = {};
    data.count = await db.all(sql`SELECT count(*) as total FROM campaigns`);
    data.samples = await db.all(sql`SELECT * FROM campaigns LIMIT 10`);
    data.tableInfo = await db.all(sql`PRAGMA table_info(campaigns)`);
    
    console.log('--- CAMPAIGNS DATA ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('--- END ---');
  } catch (err) {
    console.error('Error checking campaigns:', err);
  }
}

checkCampaigns();

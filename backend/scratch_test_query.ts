
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function testQuery() {
  const tenantId = '9142f583-09e6-4df9-b4a2-bcab048799b5';
  try {
    const stats: any = await db.all(sql`
      SELECT 
        sum(impressions) as totalImpressions,
        sum(spend) as totalSpend,
        count(*) as count
      FROM campaigns
      WHERE tenant_id = '9142f583-09e6-4df9-b4a2-bcab048799b5'
    `);
    
    console.log('Stats Result:', JSON.stringify(stats, null, 2));
    
  } catch (err) {
    console.error('Query failed:', err);
  }
}

testQuery();

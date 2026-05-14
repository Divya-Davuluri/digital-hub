import { db } from '../src/db';
import { reports, workspaces, clients } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkReports() {
  console.log('--- CHECKING REPORTS TABLE ---');
  const allReports = await db.select().from(reports);
  console.log('Total Reports found:', allReports.length);
  
  if (allReports.length > 0) {
    console.log('Latest Report Sample:', JSON.stringify(allReports[0], null, 2));
  } else {
    console.log('No reports in database.');
  }

  const allWorkspaces = await db.select().from(workspaces);
  console.log('Total Workspaces:', allWorkspaces.length);

  const allClients = await db.select().from(clients);
  console.log('Total Clients:', allClients.length);
}

checkReports().catch(console.error);

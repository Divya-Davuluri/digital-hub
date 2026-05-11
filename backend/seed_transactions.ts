import { db } from './src/db';
import { transactions } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const tenantId = '43f37c83-fc75-477c-987d-bb22899561b8';
  const data = [
    {
      id: uuidv4(),
      tenantId,
      workspaceId: 'f595054e-e70f-486d-9f2b-b4e4f29f2cbc',
      amount: 12000,
      type: 'Subscription',
      status: 'paid',
      createdAt: new Date('2026-04-25').toISOString()
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: '3b234aba-19c3-44fa-8828-dbf1d42b5fab',
      amount: 4200,
      type: 'Subscription',
      status: 'paid',
      createdAt: new Date('2026-04-22').toISOString()
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: '34fa963d-6b0e-4d09-a023-407ab64785dc',
      amount: 8500,
      type: 'Subscription',
      status: 'pending',
      createdAt: new Date('2026-04-18').toISOString()
    }
  ];

  console.log('Seeding transactions...');
  try {
    await db.insert(transactions).values(data);
    console.log('Transactions seeded successfully!');
  } catch (err) {
    console.error('Error seeding transactions:', err);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

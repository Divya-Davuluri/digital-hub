const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '../.env' });
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});
async function run() {
  const rs = await client.execute("SELECT id, name, email, role, tenant_id FROM users WHERE role = 'client' OR email LIKE '%sravani%' OR name LIKE '%sravani%'");
  console.log('Users:', rs.rows);
  const tenant_id = '9142f583-09e6-4df9-b4a2-bcab048799b5';
  const rs2 = await client.execute({ sql: "SELECT * FROM clients WHERE tenant_id = ?", args: [tenant_id] });
  console.log('Clients:', rs2.rows);
  await client.execute("INSERT OR IGNORE INTO clients (id, tenant_id, name, email, status, created_at) SELECT id, '9142f583-09e6-4df9-b4a2-bcab048799b5', name, email, 'ACTIVE', created_at FROM users WHERE name LIKE '%sravani%' OR email LIKE '%sravani%'");
  console.log('Inserted Sravani into clients');
}
run();

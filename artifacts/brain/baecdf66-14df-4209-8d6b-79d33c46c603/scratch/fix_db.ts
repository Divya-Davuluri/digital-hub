import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

async function run() {
  const client = createClient({ url, authToken });
  
  try {
    console.log('Checking sessions table...');
    const tableInfo = await client.execute("PRAGMA table_info(sessions)");
    const hasWorkspaceId = tableInfo.rows.some(row => row.name === 'workspace_id');
    
    if (!hasWorkspaceId) {
      console.log('Adding workspace_id column to sessions table...');
      await client.execute("ALTER TABLE sessions ADD COLUMN workspace_id TEXT");
    } else {
      console.log('workspace_id column already exists.');
    }
    
    console.log('Updating NULL workspace_id values...');
    await client.execute("UPDATE sessions SET workspace_id = NULL WHERE workspace_id IS NULL");
    
    console.log('Database fix completed.');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    client.close();
  }
}

run();

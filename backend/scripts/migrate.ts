import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const migrationsDir = path.join(__dirname, '../drizzle');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  console.log(`Found ${files.length} migration files.`);
  
  for (const file of files) {
    console.log(`Applying migration: ${file}`);
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sqlContent.split(';').filter(s => s.trim() !== '');
    
    for (const statement of statements) {
      try {
        await db.run(sql.raw(statement));
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          console.log(`  Skipping existing element in ${file}`);
        } else {
          console.error(`  Error in ${file}:`, err.message);
        }
      }
    }
  }
  
  console.log('✅ Migrations complete!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

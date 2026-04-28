import { createClient } from '@libsql/client';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function setup() {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  });

  const sql = fs.readFileSync('prisma/setup.sql', 'utf8');
  
  try {
    console.log('Executing SQL on Turso...');
    await libsql.executeMultiple(sql);
    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

setup();

import { db } from '../db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Fixing QR code URLs in database...');
  try {
    await db.run(sql`
      UPDATE short_links 
      SET qr_code_url = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-3h88.onrender.com/l/' || short_code
      WHERE qr_code_url LIKE '%y60b%' OR qr_code_url LIKE '%digital-hub-1.onrender.com%';
    `);
    console.log('Successfully updated QR code URLs.');
  } catch (err) {
    console.error('Error updating DB:', err);
  }
  process.exit(0);
}

run();

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function createTasksTable() {
  console.log("🛠️  MANUALLY CREATING TASKS TABLE...");
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" text PRIMARY KEY NOT NULL,
        "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "title" text NOT NULL,
        "description" text,
        "status" text DEFAULT 'todo' NOT NULL,
        "priority" text DEFAULT 'medium' NOT NULL,
        "assigned_to" text REFERENCES "users"("id") ON DELETE SET NULL,
        "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log("✅ TASKS TABLE CREATED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ ERROR CREATING TABLE:", error);
  }
}

createTasksTable();

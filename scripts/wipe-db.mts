/**
 * wipe-db.mts
 * ===========
 *
 * Drops Better Auth schema and all public database tables.
 * Inverse of setup-db.js + create-tables.sql.
 * Useful for a clean wipe before re-running upload-and-seed.mts.
 *
 * Usage:
 *   bun scripts/wipe-db.mts
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const projectJsonPath = path.resolve(process.cwd(), '.insforge', 'project.json');
const dotenvPath = path.resolve(process.cwd(), '.env.local');

if (!fs.existsSync(projectJsonPath)) {
  console.error(
    "Error: .insforge/project.json not found.\n" +
    "Run `bunx @insforge/cli create` or `bunx @insforge/cli link` first."
  );
  process.exit(1);
}

const _projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));

if (fs.existsSync(dotenvPath)) {
  const envConfig = fs.readFileSync(dotenvPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL not found in .env.local");
  process.exit(1);
}

async function wipe() {
  console.log("\n=== Wiping database: Better Auth schema + all public tables ===\n");

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const publicTables = [
    'product_reservations',
    'processed_webhooks',
    'newsletter_subscriptions',
    'product_keywords',
    'product_details',
    'product_sizes',
    'product_images',
    'products',
    'orders',
    'categories',
    'lookbook_slides',
    'editorial_content',
    'materials',
    'rate_limits',
    'audit_logs',
  ];

  for (const table of publicTables) {
    console.log(`  Dropping public.${table}...`);
    await client.query(`DROP TABLE IF EXISTS public.${table} CASCADE`);
  }

  console.log("  Dropping helper functions...");
  await client.query(`DROP FUNCTION IF EXISTS public.requesting_user_id()`);
  await client.query(`DROP FUNCTION IF EXISTS public.update_updated_at_column()`);

  console.log("  Dropping better_auth schema...");
  await client.query(`DROP SCHEMA IF EXISTS better_auth CASCADE`);

  await client.end();
  console.log("\n=== Wipe completed successfully. ===\n");
}

wipe().catch((err) => {
  console.error("\nWipe failed:", err);
  process.exit(1);
});

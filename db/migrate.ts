import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env variables from potential locations relative to the script
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('Error: Database connection URL is missing in environment variables.');
  process.exit(1);
}

// Find migrations directory dynamically
const potentialPaths = [
  path.resolve(process.cwd(), 'db/migrations'),
  path.resolve(process.cwd(), 'migrations'),
  path.resolve(__dirname, './migrations'),
  path.resolve(__dirname, '../migrations'),
  path.resolve(__dirname, '../../migrations'),
  path.resolve(__dirname, '../../../db/migrations'),
  path.resolve(__dirname, '../../../../db/migrations'),
];

let migrationsFolder = '';
for (const p of potentialPaths) {
  if (fs.existsSync(p) && fs.readdirSync(p).some(file => file.endsWith('.sql'))) {
    migrationsFolder = p;
    break;
  }
}

if (!migrationsFolder) {
  console.error('Error: Could not locate the migrations folder in any expected paths:', potentialPaths);
  process.exit(1);
}

async function main() {
  console.log('Starting database migrations...');
  console.log(`Using migrations folder: ${migrationsFolder}`);
  
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder });
    console.log('Database migrations completed successfully.');
    await migrationClient.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await migrationClient.end();
    process.exit(1);
  }
}

main();

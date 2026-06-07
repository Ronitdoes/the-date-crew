import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || '';

if (!connectionString) {
  throw new Error('Database connection URL is missing in environment variables.');
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export const db =
  globalForDb.db ??
  (() => {
    const client = postgres(connectionString, { max: 1, prepare: false });
    const instance = drizzle(client, { schema });
    if (process.env.NODE_ENV !== 'production') {
      globalForDb.db = instance;
    }
    return instance;
  })();


import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const matchmakers = pgTable('matchmakers', {
  id: uuid('id').defaultRandom().primaryKey(),
  authId: uuid('auth_id').unique().notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  authIdIdx: index('idx_matchmakers_auth_id').on(table.authId),
}));

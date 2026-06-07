import { pgTable, uuid, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { matchmakers } from './matchmakers';
import { customers } from './customers';

export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  matchmakerId: uuid('matchmaker_id').notNull().references(() => matchmakers.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  noteType: text('note_type').default('general'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  customerIdIdx: index('idx_notes_customer_id').on(table.customerId),
  matchmakerIdIdx: index('idx_notes_matchmaker_id').on(table.matchmakerId),
  noteTypeCheck: check('note_type_check', sql`${table.noteType} in ('general','call','meeting','email','observation')`),
}));

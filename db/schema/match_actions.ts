import { pgTable, uuid, text, timestamp, index, check, numeric, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { matchmakers } from './matchmakers';
import { customers } from './customers';
import { poolProfiles } from './pool_profiles';

export const matchActions = pgTable('match_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  poolProfileId: uuid('pool_profile_id').notNull().references(() => poolProfiles.id),
  matchmakerId: uuid('matchmaker_id').notNull().references(() => matchmakers.id),
  algoScore: numeric('algo_score', { precision: 5, scale: 2 }),
  aiLabel: text('ai_label'),
  aiReasoning: text('ai_reasoning'),
  aiIntroEmail: text('ai_intro_email'),
  action: text('action').default('suggested').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  customerPoolUnique: unique('match_actions_customer_id_pool_profile_id_unique').on(table.customerId, table.poolProfileId),
  customerIdIdx: index('idx_match_actions_customer').on(table.customerId),
  customerActionIdx: index('idx_match_actions_customer_action').on(table.customerId, table.action),
  poolProfileIdIdx: index('idx_match_actions_pool').on(table.poolProfileId),
  matchmakerIdIdx: index('idx_match_actions_matchmaker').on(table.matchmakerId),
  actionIdx: index('idx_match_actions_action').on(table.action),
  actionCheck: check('action_check', sql`${table.action} in ('suggested','sent','rejected')`),
}));

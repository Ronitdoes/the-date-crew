CREATE INDEX IF NOT EXISTS "idx_customers_matchmaker_gender" ON "customers" ("matchmaker_id","gender");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_matchmaker_stage" ON "customers" ("matchmaker_id","journey_stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_match_actions_customer_action" ON "match_actions" ("customer_id","action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool_gender_active" ON "pool_profiles" ("gender") WHERE is_active = TRUE;

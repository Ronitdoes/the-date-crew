CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchmaker_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"profile_photo_url" text,
	"email" text,
	"phone_number" text,
	"country" text DEFAULT 'India',
	"city" text NOT NULL,
	"height_cm" integer,
	"weight_kg" integer,
	"undergrad_college" text,
	"degree" text,
	"postgrad_college" text,
	"postgrad_degree" text,
	"current_company" text,
	"designation" text,
	"annual_income_inr" bigint,
	"income_tier" text,
	"marital_status" text,
	"siblings" integer DEFAULT 0,
	"caste" text,
	"sub_caste" text,
	"religion" text,
	"mother_tongue" text,
	"gotra" text,
	"manglik" text,
	"horoscope_required" boolean DEFAULT false,
	"diet" text,
	"drinking" text,
	"smoking" text,
	"family_type" text,
	"family_values" text,
	"languages_known" text[],
	"want_kids" text,
	"open_to_relocate" text,
	"open_to_pets" text,
	"willing_to_settle_abroad" boolean DEFAULT false,
	"preferred_age_min" integer,
	"preferred_age_max" integer,
	"preferred_height_min" integer,
	"preferred_religion" text[],
	"preferred_caste" text[],
	"preferred_city" text[],
	"journey_stage" text DEFAULT 'onboarding' NOT NULL,
	"about_me" text,
	"physically_challenged" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"pool_profile_id" uuid NOT NULL,
	"matchmaker_id" uuid NOT NULL,
	"algo_score" numeric(5, 2),
	"ai_label" text,
	"ai_reasoning" text,
	"ai_intro_email" text,
	"action" text DEFAULT 'suggested' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "match_actions_customer_id_pool_profile_id_unique" UNIQUE("customer_id","pool_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matchmakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "matchmakers_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "matchmakers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"matchmaker_id" uuid NOT NULL,
	"content" text NOT NULL,
	"note_type" text DEFAULT 'general',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pool_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"profile_photo_url" text,
	"email" text,
	"phone_number" text,
	"country" text DEFAULT 'India',
	"city" text NOT NULL,
	"height_cm" integer,
	"weight_kg" integer,
	"undergrad_college" text,
	"degree" text,
	"current_company" text,
	"designation" text,
	"annual_income_inr" bigint,
	"income_tier" text,
	"marital_status" text,
	"siblings" integer DEFAULT 0,
	"caste" text,
	"sub_caste" text,
	"religion" text,
	"mother_tongue" text,
	"gotra" text,
	"manglik" text,
	"horoscope_required" boolean DEFAULT false,
	"diet" text,
	"drinking" text,
	"smoking" text,
	"family_type" text,
	"family_values" text,
	"languages_known" text[],
	"want_kids" text,
	"open_to_relocate" text,
	"open_to_pets" text,
	"about_me" text,
	"physically_challenged" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_matchmaker_id_matchmakers_id_fk" FOREIGN KEY ("matchmaker_id") REFERENCES "public"."matchmakers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_actions" ADD CONSTRAINT "match_actions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_actions" ADD CONSTRAINT "match_actions_pool_profile_id_pool_profiles_id_fk" FOREIGN KEY ("pool_profile_id") REFERENCES "public"."pool_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_actions" ADD CONSTRAINT "match_actions_matchmaker_id_matchmakers_id_fk" FOREIGN KEY ("matchmaker_id") REFERENCES "public"."matchmakers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_matchmaker_id_matchmakers_id_fk" FOREIGN KEY ("matchmaker_id") REFERENCES "public"."matchmakers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_matchmaker_id" ON "customers" ("matchmaker_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_match_actions_customer" ON "match_actions" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_match_actions_pool" ON "match_actions" ("pool_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_match_actions_matchmaker" ON "match_actions" ("matchmaker_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_match_actions_action" ON "match_actions" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_matchmakers_auth_id" ON "matchmakers" ("auth_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notes_customer_id" ON "notes" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notes_matchmaker_id" ON "notes" ("matchmaker_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool_gender" ON "pool_profiles" ("gender");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool_active" ON "pool_profiles" ("is_active") WHERE is_active = TRUE;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "gender_check" CHECK ("gender" IN ('male', 'female', 'other'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "income_tier_check" CHECK ("income_tier" IN ('below_5l','5l_10l','10l_20l','20l_50l','50l_plus'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "marital_status_check" CHECK ("marital_status" IN ('never_married','divorced','widowed','separated'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "manglik_check" CHECK ("manglik" IN ('yes','no','anshik','dont_matter'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "diet_check" CHECK ("diet" IN ('vegetarian','non_vegetarian','eggetarian','jain','vegan'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "drinking_check" CHECK ("drinking" IN ('never','occasionally','yes'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "smoking_check" CHECK ("smoking" IN ('never','occasionally','yes'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "family_type_check" CHECK ("family_type" IN ('nuclear','joint','extended'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "family_values_check" CHECK ("family_values" IN ('traditional','moderate','liberal'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "want_kids_check" CHECK ("want_kids" IN ('yes','no','maybe'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "open_to_relocate_check" CHECK ("open_to_relocate" IN ('yes','no','maybe'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "open_to_pets_check" CHECK ("open_to_pets" IN ('yes','no','maybe'));--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "journey_stage_check" CHECK ("journey_stage" IN ('onboarding','active','match_sent','matched','closed','paused'));--> statement-breakpoint
ALTER TABLE "pool_profiles" ADD CONSTRAINT "gender_check" CHECK ("gender" IN ('male', 'female', 'other'));--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "note_type_check" CHECK ("note_type" IN ('general','call','meeting','email','observation'));--> statement-breakpoint
ALTER TABLE "match_actions" ADD CONSTRAINT "action_check" CHECK ("action" IN ('suggested','sent','rejected'));
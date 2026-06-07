# TDC Matchmaker Dashboard — Database Workspace 🗄️

This is the database workspace of the **TDC Matchmaker Dashboard**, using Drizzle ORM and Drizzle Kit to model and migrate schemas for PostgreSQL.

---

## 🔑 Environment Variables
This package does not contain its own `.env` file. It reads database connection strings from the **unified environment file** at the root of the monorepo (`../.env`).

Environment variables loaded:
*   `DATABASE_URL`: Used by client connection in `index.ts`.
*   `DIRECT_DATABASE_URL`: Used by Drizzle Kit CLI migrations in `drizzle.config.ts`.

For full definitions, refer to the [Root README.md](../README.md).

---

## 🛠️ Commands & Migration Lifecycle

Run these commands from the monorepo root (using `--filter db`) or directly in this directory:

### 1. Generate Migrations
Generate raw SQL migrations whenever you modify schemas under `schema/`:
```bash
pnpm db:generate
```

### 2. Push Schema (Direct Dev)
Push the current TypeScript schema directly to the database without generating SQL migration files (useful in local sandbox dev):
```bash
pnpm db:push
```

### 3. Run Migrations (Dev)
Apply all pending SQL migrations to the remote database:
```bash
pnpm db:migrate
```

### 4. Run Migrations (Prod / Container)
Programmatic lightweight migration launcher for production containers:
```bash
pnpm db:migrate-prod
```

### 5. Seeding Data
Seed scripts are written in TypeScript under `seeds/`:
```bash
# Seed a default Matchmaker account
pnpm tsx seeds/matchmakers.seed.ts

# Seed 100+ pool profiles using Faker
pnpm tsx seeds/pool_profiles.seed.ts
```

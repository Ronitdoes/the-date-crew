# TDC Matchmaker Dashboard 🚀

Welcome to the **TDC Matchmaker Dashboard** monorepo. This repository contains a premium, AI-powered matchmaker dashboard built using a modern TypeScript stack, structured as a `pnpm` monorepo workspace containing the frontend client, backend api server, and database schema layers.

---

## 📂 Project Structure & Architecture

The project is structured as a pnpm monorepo consisting of the following key directories:

```text
tdc-matchmaker/
├── app/
│   ├── frontend/         # Next.js 16 App Router Client
│   └── backend/          # Express API server (TypeScript)
├── db/                   # Drizzle ORM Schema, Seeds, and Migrations
├── docker-compose.yml    # Docker Compose setup for local dev / sandbox
├── package.json          # Monorepo root scripts & configuration
├── pnpm-workspace.yaml   # Workspace packages configuration
└── .env                  # Single unified environment configuration (Root)
```

### 🛠️ Technology Stack
*   **Workspace Manager**: `pnpm` Workspaces
*   **Frontend**: Next.js 16, Tailwind CSS v4, Zustand (State Management), React Query (Server Cache), GSAP & Framer Motion (High-fidelity Micro-animations and Preloader)
*   **Backend**: Node.js, Express, TypeScript, Zod (Validation), Winston (Logging), Jest & Supertest (Unit & Integration Testing)
*   **Database & ORM**: PostgreSQL (hosted via Supabase), Drizzle ORM, Drizzle Kit (Migrations CLI)
*   **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite` or custom client) for compatibility reasoning and personalized email outreach generation.

---

## 🔑 Unified Environment Configuration

To keep configurations clean and synchronized across the workspace, the project uses **a single, unified `.env` file at the root**. 

Every project layer imports and parses this root `.env` dynamically:

### 🗺️ Environment Variable Mappings
The file `.env.example` at the root contains the template:

| Variable | Description | Used by |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pooler URI (e.g. Supabase connection pool on port 6543) | `db`, `app/backend` |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL connection URI (e.g. Supabase port 5432, used for migrations) | `db` (Migrations CLI) |
| `SUPABASE_URL` | Main Supabase project URL | `app/backend` |
| `SUPABASE_ANON_KEY` | Anonymous public API key for Supabase Auth client | `app/backend` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role token for administrative backend actions | `app/backend` |
| `GEMINI_API_KEY` | Google Gemini API key for compatibility generation & rate-limited AI outreach features | `app/backend` |
| `PORT` | API server port (Defaults to `3001`) | `app/backend` |
| `NODE_ENV` | Environment context (`development`, `production`, `test`) | Backend, build scripts |
| `NEXT_PUBLIC_API_URL` | Target API gateway URL (Defaults to `http://localhost:3001/api/v1`) | `app/frontend` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL exposed to the frontend | `app/frontend` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase Anonymous key exposed to the frontend | `app/frontend` |

### 🔗 How Each Layer Loads the Root `.env`
1.  **Backend (`app/backend/src/index.ts`)**:
    Loads variables via `dotenv` by resolving paths relative to the build file directory:
    ```typescript
    import dotenv from 'dotenv';
    import path from 'path';
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
    ```
2.  **Frontend (`app/frontend/next.config.ts`)**:
    Contains a custom Node filesystem parser (`loadRootEnv()`) that reads the file at `../../.env` and maps properties into the client-safe `env` config context, preventing build-time configuration failures:
    ```typescript
    // In next.config.ts
    const rootEnv = loadRootEnv(); // Resolves to ../../.env
    const nextConfig: NextConfig = {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: rootEnv.NEXT_PUBLIC_SUPABASE_URL || rootEnv.SUPABASE_URL || "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: rootEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || rootEnv.SUPABASE_ANON_KEY || "",
        NEXT_PUBLIC_API_URL: rootEnv.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
      }
    };
    ```
3.  **Database Workspace (`db/drizzle.config.ts`)**:
    Configs load the root env relative to the config paths:
    ```typescript
    import * as dotenv from 'dotenv';
    dotenv.config({ path: '../.env' });
    ```

---

## 🚀 Getting Started & Local Development

Follow these steps to spin up the local monorepo environment:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org) (v20+ recommended)
*   [pnpm](https://pnpm.io/installation) (v9+ recommended)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (Optional, for container testing)

### 2. Dependency Setup
Install dependencies at the root workspace:
```bash
pnpm install
```

### 3. Setup Environment File
Copy the example environment file to `.env` at the root and fill in your values (Supabase endpoints, database strings, and Gemini API keys):
```bash
cp .env.example .env
```

### 4. Database Setup & Seeding
Migrate and seed your database. Navigate to `/db` or run workspace scripts from the root:
```bash
# Generate migrations SQL from schemas
pnpm --filter db db:generate

# Apply migrations to database (using DIRECT_DATABASE_URL)
pnpm --filter db db:migrate

# Push schema directly to database (alternative/dev approach)
pnpm --filter db db:push

# Run database seed scripts (inserts default Matchmaker & 100+ pool profiles using Faker)
# (Seeds are located in db/seeds/)
pnpm --filter db tsx db/seeds/matchmakers.seed.ts
pnpm --filter db tsx db/seeds/pool_profiles.seed.ts
```

### 5. Running the Monorepo
You can launch components individually or run them in parallel from the root.

#### Workspace Root Commands:
*   **Run Backend in Watch Mode**:
    ```bash
    pnpm dev:backend
    ```
*   **Run Frontend Next.js Dev Server**:
    ```bash
    pnpm dev:frontend
    ```

*Both servers can run simultaneously. The frontend will be available at [http://localhost:3000](http://localhost:3000) and proxies API traffic to [http://localhost:3001](http://localhost:3001).*

---

## 🗄️ Database & Schema Management (`/db`)

Drizzle ORM manages the database tables, located at `db/schema/`.

### 🧬 Table Definitions:
*   **`matchmakers`**: Operational profiles for dashboard users.
*   **`customers`**: Profiles of individuals seeking matches, categorized by their flow stage (e.g. `Prospect`, `Active`, `Matched`, `On Hold`, `Inactive`).
*   **`pool_profiles`**: Large pool of potential matching profiles seeded using `@faker-js/faker`.
*   **`notes`**: Matchmaker annotations, followups, and client logs.
*   **`match_actions`**: Operational log tracking recommendations, score details, AI compatibility reasons, and email outreach status.

### Production Migrations:
A production migration command is available to run database schema updates inside standard Docker/CI containers without requiring TypeScript devDependencies:
```bash
pnpm db:migrate-prod
```
This runs the lightweight programmatic migration script located at [db/migrate.ts](file:///d:/projects/tdc/db/migrate.ts).

---

## 🧠 Backend Logic & AI Engines (`/app/backend`)

The Express server handles routing, authentication middleware, client matching scoring, and AI operations.

### 📊 Client Matching Engine
The matchmaking engine calculates scores based on multiple criteria:
1.  **Deterministic Filters**: Removes profiles with unmatched sexual orientations, gender mismatch, and age variances exceeding bounds.
2.  **Scoring Heuristics**: Custom calculations based on overlapping hobbies, target location boundaries, and target age preferences.
3.  **AI Compatibility**: Matches exceeding threshold scores are submitted to **Google Gemini** to output a readability assessment (`aiLabel` e.g., High Compatibility, Mid Compatibility) and clear logic explanation (`aiReasoning`).

### 🤖 Gemini Integrations & Rate-Limiter
*   Uses model `gemini-3.1-flash-lite` (or custom client configurations) under `app/backend/src/services/ai.service.ts`.
*   Personalized email drafts can be generated dynamically for matchmaking candidates (`POST /api/v1/ai/intro-email`).
*   Protective limits prevent API overload with an in-memory rate-limiter allowing a maximum of **10 requests per minute** per active matchmaker.

### 🧪 Running Tests
The backend contains integration/unit tests for schemas, routers, algorithms, and Gemini fallbacks.
```bash
pnpm test:backend
```

---

## 🖥️ Frontend Dashboard (`/app/frontend`)

The Next.js 16 frontend provides a state-of-the-art matchmaker dashboard.

### Key Capabilities:
*   **Supabase SSR Authentication**: Synchronized session cookies with custom route-guarding middleware.
*   **Stunning UI/UX Aesthetics**:
    *   **GSAP-Powered Preloader**: Full-screen landing transition curtain with real-time percentage counters and responsive GSAP hooks.
    *   **Modern Theme**: Deep obsidian styles, smooth grid tables, sliding panel sheets for biodata view, and Framer Motion micro-interactions.
*   **Real-Time Dashboard**: Includes stage-track progress steppers, rich detail cards for matches, and an automated text compiler for sending email pitches.

### Building for Production:
```bash
pnpm build:frontend
```

---

## 🐳 Docker Deployment

The application is prepared for Docker deployment. The system uses a multi-stage Dockerfile setup for container compilation.

### Running with Docker Compose:
To spin up the system using docker:
```bash
docker-compose up --build
```
This builds the Express app and exposes port `3001`, copying dependencies using `pnpm` workspace filters inside the containers.

---

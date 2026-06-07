# TDC Matchmaker Dashboard — Implementation Plan

> **Project:** The Date Crew (TDC) Internal Matchmaker Tool MVP  
> **Stack:** React · Node.js/Express · Supabase (Postgres + Auth) · Drizzle ORM · Docker · Render · GitHub Actions  
> **Version:** 1.0  
> **Date:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Technical Architecture](#3-technical-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Implementation Phases](#7-implementation-phases)
8. [Development Tasks](#8-development-tasks)
9. [Security Considerations](#9-security-considerations)
10. [Performance Considerations](#10-performance-considerations)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Strategy](#12-deployment-strategy)
13. [Risks and Mitigation](#13-risks-and-mitigation)
14. [Timeline & Milestones](#14-timeline--milestones)

---

## 1. Project Overview

### 1.1 Objective

Build an internal web-based Matchmaker Dashboard MVP for the TDC team. The tool enables matchmakers to view verified client profiles, track each client's journey stage, run a gender-specific compatibility algorithm, get AI-powered match scores and email intros, and take action (send match) from a single interface.

### 1.2 Scope

**In scope:**
- Matchmaker authentication (login/logout) via Supabase Auth
- Customer (client) list dashboard with status tags and filters
- Full biodata view per customer with all Indian matrimonial fields
- A pool of 100+ dummy opposite-gender profiles
- Gender-specific matching algorithm (rule-based + scored)
- AI-powered match scoring with reasoning (Claude/OpenAI)
- AI-generated personalised intro email drafts
- "Send Match" action with modal confirmation and mock email trigger
- Notes system: add/edit/delete call or meeting notes per client
- REST API (Node.js/Express) containerised with Docker
- CI/CD via GitHub Actions → deploy to Render
- Supabase Postgres with Drizzle ORM for schema and migrations

**Out of scope (v1):**
- Client-facing portal or mobile app
- Payment or subscription flows
- Real email delivery (mocked in v1)
- Admin/super-admin roles

### 1.3 Success Criteria

| Criterion | Measure |
|---|---|
| Auth works end-to-end | Matchmaker can log in, access their assigned clients, and log out |
| Dashboard loads | All assigned customers visible with correct tags within 2 s |
| Matching runs | At least top 10 ranked matches returned per customer |
| AI score displayed | Every suggested match shows a score + 1-sentence reasoning |
| Intro email generated | AI draft email visible in modal on "Send Match" click |
| Notes CRUD | Create, edit, and delete a note from the detail view |
| CI/CD green | `main` branch push triggers test → build → deploy pipeline |
| Hosted live | Production URL accessible and functional on Render |

---

## 2. Functional Requirements

### 2.1 Core Features

#### F1 — Authentication
- Login page (email + password) powered by Supabase Auth
- Protected routes; unauthenticated users redirected to `/login`
- Logout clears session

#### F2 — Matchmaker Dashboard (Customer List)
- Table/card view of all customers assigned to the logged-in matchmaker
- Visible columns: Name, Age, City, Marital Status, Journey Status Tag, Profile Photo (avatar)
- Quick filters: by gender, status tag, city
- Clicking a row opens the Customer Detail view
- Pagination (20 per page)

#### F3 — Customer Detail View
- Full biodata panel (all fields from spec + Indian-specific fields)
- Journey stage tracker (Onboarding → Active → Match Sent → Matched → Closed)
- Notes panel: timestamped notes list, add/edit/delete
- "Find Matches" button that triggers the matching algorithm
- Match suggestions panel with AI scores

#### F4 — Matching Algorithm
- **Male clients:** Score women who are younger, earn less, are shorter, share children preference
- **Female clients:** Score on profession compatibility, shared relocation preference, shared values (religion, family type, diet), income tier parity, age proximity
- Returns top 10 ranked matches from the pool with score (0–100) and explanation tags
- Filters out already-sent matches

#### F5 — AI Integration (Claude Sonnet via Anthropic API)
- **Match Score Reasoning:** For each suggested match, call the LLM to produce a 1-sentence "why this match" explanation and a label: `High Potential`, `Good Fit`, `Compatible`, `Tentative`
- **Intro Email Draft:** On "Send Match" click, generate a personalised outreach email body using both profiles' key details

#### F6 — Match Action
- "Send Match" button on each suggested match card
- Opens modal showing: match profile summary, AI-generated intro email draft, editable email body
- On confirm: records the action in `match_actions` table, shows success toast
- Sent matches are marked and excluded from future suggestions

#### F7 — Pool Management (Internal)
- 100+ dummy opposite-gender profiles pre-seeded in Supabase
- Accessible via the matching engine

### 2.2 User Flows

```
[Login] ──────────────────────────────────────────────────────────────►
         Supabase Auth validates → JWT stored → redirect /dashboard

[Dashboard] ──────────────────────────────────────────────────────────►
         Load matchmaker's customers → display table → click customer row

[Customer Detail] ────────────────────────────────────────────────────►
         View biodata → add/edit note → click "Find Matches"
              │
              ▼
         [Matching Algorithm runs on backend]
              │
              ▼
         Top 10 matches displayed with AI scores
              │
              ▼ click "Send Match"
         Modal opens (profile summary + AI email draft)
              │
              ▼ confirm
         Match action recorded → toast "Match Sent!"
```

### 2.3 Business Rules

- A matchmaker can only see customers assigned to them (`matchmaker_id` FK)
- Pool profiles are read-only and shared across all matchmakers
- Matching is always cross-gender: male clients matched against female pool, and vice versa
- A match that has been "sent" cannot be suggested again for the same client
- Journey status can only move forward (no back-transitions in v1)
- Notes are private to the matchmaker who created them
- AI calls are server-side only; API keys never exposed to the browser

---

## 3. Technical Architecture

### 3.1 Frontend Architecture

```
app/frontend/
├── Next.js 14+ (App Router)
├── React 18/19
├── TanStack Query v5         (server state, caching, mutations)
├── Zustand                   (UI state: auth session, modals)
├── Tailwind CSS v3           (utility-first styling)
├── shadcn/ui                 (headless accessible components)
├── Axios / Fetch             (HTTP client / data fetching)
└── Zod                       (form validation schemas)
```

**Key design decisions:**
- Next.js App Router for hybrid routing, server/client components, and performance optimizations
- TanStack Query handles client-side state caching, refetching, and mutations
- Zustand store holds the Supabase JWT so client-side API requests attach `Authorization: Bearer <token>`
- Tailwind + shadcn/ui (configured for App Router compatibility) gives a clean, consistent UI

### 3.2 Backend Architecture

```
app/backend/
├── Node.js 20 LTS + TypeScript
├── Express 4                 (HTTP server)
├── Drizzle ORM               (type-safe query builder)
├── Supabase JS Client        (Auth verification)
├── OpenAI SDK / Anthropic SDK (AI features)
├── Zod                       (request validation middleware)
└── Winston                   (structured logging)
```

**Request lifecycle:**
```
Client Request
    │
    ▼
Express Router
    │
    ▼
Auth Middleware (verifies Supabase JWT, injects req.user)
    │
    ▼
Validation Middleware (Zod schema on body/params/query)
    │
    ▼
Controller (thin: calls service, returns response)
    │
    ▼
Service Layer (business logic, matching engine, AI calls)
    │
    ▼
Drizzle ORM → Supabase Postgres
```

### 3.3 Database Design

Supabase-hosted PostgreSQL (pooler connection string used in production). Drizzle ORM manages schema and migrations from the `db/` workspace.

**Schema overview:**

```
matchmakers ──────< customers
                       │
                       ├──< notes
                       └──< match_actions >── pool_profiles
                                │
                             (also references pool_profiles)
pool_profiles (read-only seed data)
```

Full DDL in Section 5.

### 3.4 Third-Party Integrations

| Service | Purpose | Notes |
|---|---|---|
| Supabase Auth | JWT-based matchmaker login | Magic link disabled; email+password only |
| Supabase Postgres | Primary database | Direct pooler URL for backend |
| Anthropic Claude Sonnet | Match score reasoning + intro email | Server-side only; model: `claude-sonnet-4-20250514` |
| Render | Hosting backend (Docker web service) + frontend (static site) | Two separate Render services |
| GitHub Actions | CI/CD pipeline | Test → Build → Deploy on push to `main` |
| Docker Hub / GHCR | Container registry | Push backend image from CI |

### 3.5 API Design

RESTful JSON API. Base path: `/api/v1`. All endpoints (except `/api/v1/auth/login`) require a valid Supabase JWT in the `Authorization: Bearer` header.

Full endpoint catalogue in Section 6.

---

## 4. Folder Structure

```
tdc-matchmaker/                         ← repo root
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      ← run tests on every PR
│       └── deploy.yml                  ← build + deploy on push to main
│
├── app/                                ← application code
│   ├── frontend/                       ← Next.js Web App
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── app/                    ← Next.js App Router Pages
│   │   │   │   ├── layout.tsx          ← Root layout with providers
│   │   │   │   ├── page.tsx            ← Dashboard redirect / landing page
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx        ← Login page
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx        ← Dashboard overview page
│   │   │   │   ├── customer/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx    ← Customer detail page
│   │   │   │   └── not-found.tsx       ← Custom 404 page
│   │   │   ├── components/
│   │   │   │   ├── ui/                 ← shadcn base components (Button, Card, Badge…)
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppShell.tsx    ← sidebar + topbar wrapper
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Topbar.tsx
│   │   │   │   ├── customers/
│   │   │   │   │   ├── CustomerTable.tsx
│   │   │   │   │   ├── CustomerCard.tsx
│   │   │   │   │   ├── StatusBadge.tsx
│   │   │   │   │   └── JourneyTracker.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   ├── BiodataPanel.tsx
│   │   │   │   │   └── ProfileAvatar.tsx
│   │   │   │   ├── matches/
│   │   │   │   │   ├── MatchCard.tsx
│   │   │   │   │   ├── MatchScoreBar.tsx
│   │   │   │   │   ├── SendMatchModal.tsx
│   │   │   │   │   └── AIIntroEditor.tsx
│   │   │   │   └── notes/
│   │   │   │       ├── NotesList.tsx
│   │   │   │       └── NoteEditor.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useCustomers.ts
│   │   │   │   ├── useMatches.ts
│   │   │   │   └── useNotes.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts              ← Axios instance with auth interceptor
│   │   │   │   ├── queryClient.ts      ← TanStack Query setup
│   │   │   │   └── utils.ts
│   │   │   ├── store/
│   │   │   │   └── authStore.ts        ← Zustand: session, matchmaker info
│   │   │   └── types/
│   │   │       └── index.ts            ← shared TypeScript types
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── Dockerfile                  ← multi-stage: build → Next.js standalone runner
│   │   └── package.json
│   │
│   └── backend/                        ← Express API
│       ├── src/
│       │   ├── routes/
│       │   │   ├── index.ts            ← mounts all routers
│       │   │   ├── auth.routes.ts
│       │   │   ├── customers.routes.ts
│       │   │   ├── notes.routes.ts
│       │   │   ├── matches.routes.ts
│       │   │   ├── pool.routes.ts
│       │   │   └── ai.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── customers.controller.ts
│       │   │   ├── notes.controller.ts
│       │   │   ├── matches.controller.ts
│       │   │   ├── pool.controller.ts
│       │   │   └── ai.controller.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts     ← Supabase JWT verification
│       │   │   ├── matching.service.ts ← core algo
│       │   │   ├── ai.service.ts       ← Anthropic API calls
│       │   │   └── email.service.ts    ← mock email (logs to console)
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts  ← verify JWT, inject req.user
│       │   │   ├── validate.middleware.ts ← Zod schema validation
│       │   │   └── error.middleware.ts ← global error handler
│       │   ├── config/
│       │   │   └── env.ts              ← validated env vars (zod)
│       │   ├── utils/
│       │   │   ├── logger.ts           ← Winston logger
│       │   │   └── scoring.ts          ← helper for numeric scoring
│       │   └── index.ts                ← Express app entry point
│       ├── Dockerfile                  ← single-stage Node image
│       ├── .dockerignore
│       ├── tsconfig.json
│       └── package.json
│
├── db/                                 ← database workspace
│   ├── schema/
│   │   ├── matchmakers.ts              ← Drizzle table definitions
│   │   ├── customers.ts
│   │   ├── pool_profiles.ts
│   │   ├── notes.ts
│   │   ├── match_actions.ts
│   │   └── index.ts                    ← re-exports all schemas
│   ├── migrations/                     ← generated by drizzle-kit
│   │   └── 0001_initial.sql
│   ├── seeds/
│   │   ├── matchmakers.seed.ts
│   │   └── pool_profiles.seed.ts       ← 100+ dummy profiles
│   ├── drizzle.config.ts
│   └── package.json
│
├── docker-compose.yml                  ← local dev: backend + postgres proxy
├── docker-compose.override.yml         ← dev overrides (hot reload)
├── .env.example
├── .gitignore
└── README.md
```

### 4.1 Explanation of Major Directories

| Directory | Role |
|---|---|
| `app/frontend/src/components/ui/` | Unstyled shadcn primitives — Button, Input, Modal, Toast, Badge, etc. Never write business logic here |
| `app/frontend/src/hooks/` | TanStack Query hooks that wrap all API calls; components call hooks, not `api.ts` directly |
| `app/frontend/src/store/` | Zustand for client-side-only state (JWT, sidebar open/close). No server data lives here |
| `app/backend/src/services/` | All business logic lives here. Controllers are thin: validate input → call service → return response |
| `app/backend/src/middleware/` | Cross-cutting concerns. Auth middleware runs on every protected route |
| `db/schema/` | Single source of truth for table definitions. Imported by both migrations and the backend |
| `db/seeds/` | Seed scripts run once against Supabase to populate matchmaker accounts and the 100+ pool profiles |
| `.github/workflows/` | Two workflows: `ci.yml` (PR checks) and `deploy.yml` (push to main) |

---

## 5. Database Schema

### 5.1 Tables

#### `matchmakers`
Maps to Supabase Auth users. Created automatically on first login via a Supabase Auth hook.

```sql
CREATE TABLE matchmakers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE NOT NULL,          -- Supabase Auth user.id
  full_name   TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `customers`
Clients actively managed by a matchmaker.

```sql
CREATE TABLE customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id         UUID NOT NULL REFERENCES matchmakers(id) ON DELETE CASCADE,

  -- Identity
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  gender                TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth         DATE NOT NULL,
  profile_photo_url     TEXT,

  -- Contact
  email                 TEXT,
  phone_number          TEXT,

  -- Location
  country               TEXT DEFAULT 'India',
  city                  TEXT NOT NULL,

  -- Physical
  height_cm             INTEGER,                        -- stored as integer, display in ft/in
  weight_kg             INTEGER,

  -- Education & Career
  undergrad_college     TEXT,
  degree                TEXT,
  postgrad_college      TEXT,
  postgrad_degree       TEXT,
  current_company       TEXT,
  designation           TEXT,
  annual_income_inr     BIGINT,                         -- stored in INR
  income_tier           TEXT CHECK (income_tier IN ('below_5l','5l_10l','10l_20l','20l_50l','50l_plus')),

  -- Family & Background
  marital_status        TEXT CHECK (marital_status IN ('never_married','divorced','widowed','separated')),
  siblings              INTEGER DEFAULT 0,
  caste                 TEXT,
  sub_caste             TEXT,
  religion              TEXT,
  mother_tongue         TEXT,
  gotra                 TEXT,                           -- clan lineage, relevant in Hindu matrimony
  manglik               TEXT CHECK (manglik IN ('yes','no','anshik','dont_matter')),
  horoscope_required    BOOLEAN DEFAULT FALSE,

  -- Lifestyle
  diet                  TEXT CHECK (diet IN ('vegetarian','non_vegetarian','eggetarian','jain','vegan')),
  drinking              TEXT CHECK (drinking IN ('never','occasionally','yes')),
  smoking               TEXT CHECK (smoking IN ('never','occasionally','yes')),
  family_type           TEXT CHECK (family_type IN ('nuclear','joint','extended')),
  family_values         TEXT CHECK (family_values IN ('traditional','moderate','liberal')),

  -- Languages
  languages_known       TEXT[],                         -- array: ['Hindi','English','Punjabi']

  -- Preferences / Dealbreakers
  want_kids             TEXT CHECK (want_kids IN ('yes','no','maybe')),
  open_to_relocate      TEXT CHECK (open_to_relocate IN ('yes','no','maybe')),
  open_to_pets          TEXT CHECK (open_to_pets IN ('yes','no','maybe')),
  willing_to_settle_abroad BOOLEAN DEFAULT FALSE,

  -- Partner Preferences (high-level, used to filter pool)
  preferred_age_min     INTEGER,
  preferred_age_max     INTEGER,
  preferred_height_min  INTEGER,
  preferred_religion    TEXT[],
  preferred_caste       TEXT[],
  preferred_city        TEXT[],

  -- Journey
  journey_stage         TEXT NOT NULL DEFAULT 'onboarding'
                        CHECK (journey_stage IN ('onboarding','active','match_sent','matched','closed','paused')),

  -- Misc
  about_me              TEXT,                           -- short bio / intro paragraph
  physically_challenged BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

#### `pool_profiles`
Read-only pool of eligible matches. Same fields as `customers` minus `matchmaker_id` and `journey_stage`.

```sql
CREATE TABLE pool_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- All same columns as customers EXCEPT matchmaker_id, journey_stage, preferred_* cols
  -- (copy all identity/physical/education/career/family/lifestyle columns)
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  gender                TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth         DATE NOT NULL,
  profile_photo_url     TEXT,
  email                 TEXT,
  phone_number          TEXT,
  country               TEXT DEFAULT 'India',
  city                  TEXT NOT NULL,
  height_cm             INTEGER,
  weight_kg             INTEGER,
  undergrad_college     TEXT,
  degree                TEXT,
  current_company       TEXT,
  designation           TEXT,
  annual_income_inr     BIGINT,
  income_tier           TEXT,
  marital_status        TEXT,
  siblings              INTEGER DEFAULT 0,
  caste                 TEXT,
  sub_caste             TEXT,
  religion              TEXT,
  mother_tongue         TEXT,
  gotra                 TEXT,
  manglik               TEXT,
  horoscope_required    BOOLEAN DEFAULT FALSE,
  diet                  TEXT,
  drinking              TEXT,
  smoking               TEXT,
  family_type           TEXT,
  family_values         TEXT,
  languages_known       TEXT[],
  want_kids             TEXT,
  open_to_relocate      TEXT,
  open_to_pets          TEXT,
  about_me              TEXT,
  physically_challenged BOOLEAN DEFAULT FALSE,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

#### `notes`

```sql
CREATE TABLE notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  matchmaker_id   UUID NOT NULL REFERENCES matchmakers(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  note_type       TEXT DEFAULT 'general'
                  CHECK (note_type IN ('general','call','meeting','email','observation')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `match_actions`

```sql
CREATE TABLE match_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  pool_profile_id     UUID NOT NULL REFERENCES pool_profiles(id),
  matchmaker_id       UUID NOT NULL REFERENCES matchmakers(id),
  algo_score          NUMERIC(5,2),                    -- 0.00 to 100.00
  ai_label            TEXT,                             -- 'High Potential' etc.
  ai_reasoning        TEXT,                             -- 1-sentence explanation
  ai_intro_email      TEXT,                             -- generated email body
  action              TEXT NOT NULL DEFAULT 'suggested'
                      CHECK (action IN ('suggested','sent','rejected')),
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, pool_profile_id)                 -- one record per customer-pool pair
);
```

### 5.2 Relationships

```
matchmakers (1) ──────< (N) customers
matchmakers (1) ──────< (N) notes
customers   (1) ──────< (N) notes
customers   (1) ──────< (N) match_actions
pool_profiles (1) ────< (N) match_actions
```

### 5.3 Indexes

```sql
-- Auth lookups
CREATE INDEX idx_matchmakers_auth_id ON matchmakers(auth_id);

-- Dashboard load: all customers for a matchmaker
CREATE INDEX idx_customers_matchmaker_id ON customers(matchmaker_id);

-- Matching: filter pool by gender quickly
CREATE INDEX idx_pool_gender ON pool_profiles(gender);
CREATE INDEX idx_pool_active ON pool_profiles(is_active) WHERE is_active = TRUE;

-- Avoid re-suggesting sent matches
CREATE INDEX idx_match_actions_customer ON match_actions(customer_id);
CREATE INDEX idx_match_actions_pool ON match_actions(pool_profile_id);
CREATE INDEX idx_match_actions_action ON match_actions(action);

-- Notes lookup
CREATE INDEX idx_notes_customer_id ON notes(customer_id);
```

### 5.4 Migration Strategy

Drizzle Kit is used for schema management from the `db/` workspace.

```bash
# Generate migration from schema changes
cd db && npx drizzle-kit generate

# Apply migrations (run from CI or locally)
cd db && npx drizzle-kit migrate

# Push schema directly in dev (no migration file)
cd db && npx drizzle-kit push
```

Migration files are committed to version control under `db/migrations/`. In CI, `drizzle-kit migrate` runs before the new backend container starts (as a pre-deploy step or a separate Render job).

**Seed data:**
```bash
cd db && npx tsx seeds/matchmakers.seed.ts
cd db && npx tsx seeds/pool_profiles.seed.ts
```

---

## 6. API Specification

### 6.1 Conventions

- Base URL: `https://<backend-render-url>/api/v1`
- All responses: `Content-Type: application/json`
- Auth header: `Authorization: Bearer <supabase_access_token>`
- Error envelope:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
  ```
- Success envelope (list):
  ```json
  { "data": [...], "meta": { "total": 100, "page": 1, "perPage": 20 } }
  ```
- Success envelope (single):
  ```json
  { "data": { ... } }
  ```

### 6.2 Endpoints

#### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Exchange email+password for Supabase session tokens |
| `POST` | `/auth/logout` | Invalidate session |
| `GET` | `/auth/me` | Return current matchmaker profile |

**POST /auth/login — Request**
```json
{ "email": "matchmaker@tdc.com", "password": "secret" }
```
**POST /auth/login — Response 200**
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<token>",
    "matchmaker": { "id": "uuid", "fullName": "Priya Sharma", "email": "..." }
  }
}
```

---

#### Customers

| Method | Path | Description |
|---|---|---|
| `GET` | `/customers` | Paginated list of matchmaker's customers |
| `GET` | `/customers/:id` | Full customer detail |
| `POST` | `/customers` | Create new customer |
| `PUT` | `/customers/:id` | Update customer fields |
| `PATCH` | `/customers/:id/stage` | Advance journey stage |
| `DELETE` | `/customers/:id` | Soft-delete (mark paused/closed) |

**GET /customers — Query params**
```
?page=1&perPage=20&gender=female&stage=active&city=Mumbai&search=Rahul
```

**GET /customers — Response 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Rahul",
      "lastName": "Mehta",
      "age": 28,
      "city": "Mumbai",
      "maritalStatus": "never_married",
      "journeyStage": "active",
      "profilePhotoUrl": "https://..."
    }
  ],
  "meta": { "total": 45, "page": 1, "perPage": 20 }
}
```

**POST /customers — Request body** (subset of fields shown)
```json
{
  "firstName": "Anjali",
  "lastName": "Patel",
  "gender": "female",
  "dateOfBirth": "1997-04-15",
  "city": "Ahmedabad",
  "maritalStatus": "never_married",
  "religion": "Hindu",
  "caste": "Patel",
  "diet": "vegetarian",
  "wantKids": "yes",
  "openToRelocate": "maybe",
  "annualIncomeInr": 1200000,
  "incomeTier": "10l_20l",
  "currentCompany": "Infosys",
  "designation": "Software Engineer",
  "languagesKnown": ["Gujarati", "Hindi", "English"],
  "familyType": "nuclear",
  "familyValues": "moderate"
}
```

---

#### Notes

| Method | Path | Description |
|---|---|---|
| `GET` | `/customers/:id/notes` | All notes for a customer |
| `POST` | `/customers/:id/notes` | Create a note |
| `PUT` | `/notes/:noteId` | Edit a note |
| `DELETE` | `/notes/:noteId` | Delete a note |

**POST /customers/:id/notes — Request**
```json
{ "content": "Called on 4 June. Client is open to Pune relocation.", "noteType": "call" }
```

---

#### Matches

| Method | Path | Description |
|---|---|---|
| `GET` | `/customers/:id/matches` | Previously computed/sent matches |
| `POST` | `/customers/:id/matches/run` | Run matching algorithm, return top 10 |
| `POST` | `/matches/:matchActionId/send` | Mark as sent, trigger mock email |
| `POST` | `/matches/:matchActionId/reject` | Mark as rejected |

**POST /customers/:id/matches/run — Response 200**
```json
{
  "data": [
    {
      "matchActionId": "uuid",
      "poolProfile": { "id": "uuid", "firstName": "Sneha", "age": 25, "city": "Pune", ... },
      "algoScore": 82.5,
      "scoreTags": ["age_match", "religion_match", "kids_preference_match"],
      "aiLabel": "High Potential",
      "aiReasoning": "Sneha shares Rahul's preference for children and relocating, with complementary career profiles."
    }
  ]
}
```

**POST /matches/:matchActionId/send — Response 200**
```json
{
  "data": {
    "matchActionId": "uuid",
    "action": "sent",
    "aiIntroEmail": "Dear Rahul,\n\nWe're excited to introduce you to Sneha Desai, a 25-year-old Software Engineer based in Pune..."
  }
}
```

---

#### Pool

| Method | Path | Description |
|---|---|---|
| `GET` | `/pool` | Paginated pool profiles (admin use) |
| `GET` | `/pool/:id` | Single pool profile detail |

---

#### AI

| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/score` | Score a specific customer-pool pair |
| `POST` | `/ai/intro-email` | Generate intro email for a match |

**POST /ai/intro-email — Request**
```json
{
  "customerId": "uuid",
  "poolProfileId": "uuid"
}
```
**POST /ai/intro-email — Response 200**
```json
{
  "data": {
    "emailSubject": "Introducing Sneha Desai — A Potential Match from The Date Crew",
    "emailBody": "Dear Rahul,\n\nWe are delighted to introduce you to Sneha..."
  }
}
```

### 6.3 Authentication & Authorization

- Every request (except `/auth/login`) must carry `Authorization: Bearer <jwt>`
- The `auth.middleware.ts` calls `supabase.auth.getUser(token)` to verify the JWT
- On success, `req.user = { supabaseId, matchmakerId }` is injected
- Controllers enforce row-level ownership: `WHERE matchmaker_id = req.user.matchmakerId`
- Supabase Row Level Security (RLS) is also enabled as a database-layer backstop

### 6.4 Error Handling

| HTTP Code | Code Constant | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema fails |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Authenticated but accessing another matchmaker's data |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate match action |
| 429 | `RATE_LIMITED` | AI endpoint called too fast |
| 500 | `INTERNAL_ERROR` | Unhandled exception (logged, not exposed) |

---

## 7. Implementation Phases

### Phase 0 — Repo & Infrastructure Bootstrap (Days 1–2)

**Goal:** Working local dev environment, CI skeleton, empty Supabase project.

Tasks:
- Create monorepo with `app/frontend`, `app/backend`, `db/` directories
- Set up `docker-compose.yml` for local dev (backend container, env vars pointing to Supabase)
- Create Supabase project, enable Auth (email/password), note connection strings
- Configure `drizzle.config.ts` pointing to Supabase connection string
- Create `.env.example` with all required keys
- Add `ci.yml` GitHub Actions workflow: lint + typecheck on every push

Deliverables: `docker compose up` starts backend; `pnpm dev` starts frontend.

---

### Phase 1 — Database Schema & Seed Data (Days 3–4)

**Goal:** All tables created in Supabase; 100+ pool profiles seeded.

Tasks:
- Write Drizzle schema files for all 5 tables
- Run `drizzle-kit generate` and `drizzle-kit migrate` against Supabase
- Write `pool_profiles.seed.ts` with 60 female + 40 male profiles (varied cities, religions, income tiers, ages 22–38)
- Write `matchmakers.seed.ts` for 2 test accounts
- Enable RLS on `customers`, `notes`, `match_actions`
- Write RLS policies: matchmakers can only SELECT/INSERT/UPDATE/DELETE their own rows

Deliverables: Supabase dashboard shows populated tables; RLS policies active.

---

### Phase 2 — Backend: Auth & Customer CRUD (Days 5–8)

**Goal:** All `/auth/*` and `/customers/*` endpoints working.

Tasks:
- Express app skeleton: CORS, JSON body parser, Winston logger, global error handler
- `auth.middleware.ts`: verify Supabase JWT
- `validate.middleware.ts`: Zod schema factory
- Implement `/auth/login`, `/auth/logout`, `/auth/me`
- Implement `GET /customers`, `GET /customers/:id`, `POST /customers`, `PUT /customers/:id`, `PATCH /customers/:id/stage`
- Implement `GET /customers/:id/notes`, `POST /customers/:id/notes`, `PUT /notes/:id`, `DELETE /notes/:id`
- Write unit tests for matching service helpers
- Write integration tests for auth and customer endpoints (supertest)

Deliverables: All CRUD endpoints pass integration tests; Postman collection works.

---

### Phase 3 — Matching Algorithm (Days 9–11)

**Goal:** `/customers/:id/matches/run` returns ranked, scored matches.

Tasks:
- Implement `matching.service.ts` with gender-specific scoring:
  - **Male client scoring rubric** (total 100 pts):
    - Age younger by 1–5 yrs: 20 pts (>5 yrs: 10 pts)
    - Income lower (pool < client): 15 pts
    - Height shorter (pool < client): 10 pts
    - Want kids match: 20 pts
    - Religion match: 15 pts
    - Marital status match (never married): 10 pts
    - City/relocation compatibility: 10 pts
  - **Female client scoring rubric** (total 100 pts):
    - Profession tier compatibility: 20 pts
    - Values alignment (family_values field): 20 pts
    - Relocation preference match: 15 pts
    - Religion match: 15 pts
    - Age proximity (±3 yrs preferred): 15 pts
    - Diet match: 10 pts
    - Language overlap: 5 pts
- Filter out already-sent matches (`match_actions.action = 'sent'`)
- Persist top 10 results as `match_actions` rows with `action='suggested'`
- Implement `POST /matches/:id/send` and `POST /matches/:id/reject`
- Write unit tests covering edge cases (all scores 0, all scores 100, empty pool)

Deliverables: Algorithm returns reasonable top-10 for both a male and female test customer.

---

### Phase 4 — AI Integration (Days 12–14)

**Goal:** Every suggested match has an AI label + reasoning; "Send Match" generates intro email.

Tasks:
- Implement `ai.service.ts` using Anthropic SDK (`claude-sonnet-4-20250514`)
- **Match scoring prompt:** System prompt defines matchmaker persona; user message contains both profiles as JSON; request JSON response `{ label, reasoning }` with max_tokens 200
- **Intro email prompt:** System prompt with TDC brand voice; user message contains both profiles; response is email subject + body max 300 words
- Call AI scoring after the algo runs and store `ai_label` and `ai_reasoning` in `match_actions`
- `POST /ai/intro-email` lazily generates and stores `ai_intro_email` on the match action record
- Add rate limiting on AI endpoints (10 req/min per matchmaker via in-memory store)
- Handle Anthropic API errors gracefully: fall back to rule-based label if AI fails

Deliverables: Every match card displays label + reasoning; intro email visible in modal.

---

### Phase 5 — Frontend (Days 15–20)

**Goal:** Fully functional Next.js App Router application connected to the live API.

Tasks:
- Setup Next.js + Tailwind + shadcn
- Zustand auth store: store JWT, matchmaker info, handle token refresh
- Axios instance with Bearer token interceptor and 401 → redirect to login
- **LoginPage (`/login/page.tsx`):** Email/password form → POST /auth/login → store tokens → redirect
- **DashboardPage (`/dashboard/page.tsx`):** `useCustomers` hook (TanStack Query) → CustomerTable with status badges, filters, pagination
- **CustomerDetailPage (`/customer/[id]/page.tsx`):**
  - BiodataPanel: all fields in a clean two-column card layout
  - JourneyTracker: 5-step progress bar
  - NotesList + NoteEditor (inline add/edit)
  - "Find Matches" button → `POST /customers/:id/matches/run` → MatchCard list
- **MatchCard:** Profile avatar, name, age, city, algoScore bar, AI label badge, AI reasoning text, "Send Match" button
- **SendMatchModal:** Profile summary + editable intro email textarea + Confirm/Cancel
- Toast notifications for success/error states
- Responsive layout (works on 1280px+ desktop; tablet-friendly)

Deliverables: End-to-end flow works from login to sending a match.

---

### Phase 6 — Docker, CI/CD & Deployment (Days 21–24)

**Goal:** App live on Render; CI/CD pipeline fully operational.

Tasks:
- Write `app/backend/Dockerfile` (node:20-alpine, multi-stage: build TS → run JS)
- Write `app/frontend/Dockerfile` (node:20-alpine build → Next.js standalone server)
- Test containers locally with `docker compose up`
- Create Render services: Web Service (backend Docker), Web Service (frontend Next.js Docker)
- Set all env vars in Render dashboard
- Write `deploy.yml` GitHub Actions:
  - `test` job: lint, typecheck, unit + integration tests
  - `build-and-push` job: build Docker image, push to GHCR
  - `deploy` job: trigger Render deploy hook via `curl`
- Configure Render auto-deploy from `main` branch
- Run migration as pre-deploy step (`drizzle-kit migrate` in backend startup)

Deliverables: Live hosted URL; green CI badge on README.

---

### Phase 7 — Polish & Documentation (Days 25–26)

**Goal:** Production-ready submission.

Tasks:
- Add loading skeletons to dashboard and detail page
- Empty state illustrations for zero matches / zero notes
- Error boundary component for graceful failure UI
- Write README with setup instructions, sample credentials, tech write-up (as required by assignment)
- Add JSDoc comments on matching service and AI service
- Final accessibility pass (keyboard nav, ARIA labels on modals)
- Create 2 demo matchmaker accounts + 5 demo customers

Deliverables: Submission-ready package.

---

## 8. Development Tasks

### 8.1 Frontend Tasks

| ID | Task | Phase | Est. (hrs) |
|---|---|---|---|
| FE-01 | Next.js + Tailwind + shadcn bootstrap | 5 | 3 |
| FE-02 | Zustand auth store + Axios interceptor | 5 | 3 |
| FE-03 | LoginPage with App Router layout | 5 | 3 |
| FE-04 | AppShell layout (sidebar + topbar components) | 5 | 4 |
| FE-05 | DashboardPage: customer table + filters + pagination | 5 | 6 |
| FE-06 | CustomerDetailPage: biodata panel (all fields) | 5 | 5 |
| FE-07 | JourneyTracker component | 5 | 2 |
| FE-08 | NotesList + NoteEditor | 5 | 4 |
| FE-09 | MatchCard with score bar + AI badge | 5 | 4 |
| FE-10 | SendMatchModal with AI email editor | 5 | 4 |
| FE-11 | TanStack Query hooks for all endpoints | 5 | 5 |
| FE-12 | Toast notification system | 5 | 1 |
| FE-13 | Loading skeletons + error states | 7 | 3 |
| FE-14 | Responsive layout & accessibility | 7 | 4 |

### 8.2 Backend Tasks

| ID | Task | Phase | Est. (hrs) |
|---|---|---|---|
| BE-01 | Express scaffold + middleware setup | 2 | 3 |
| BE-02 | Supabase JWT auth middleware | 2 | 2 |
| BE-03 | Auth routes (login/logout/me) | 2 | 2 |
| BE-04 | Customer routes + controller + service | 2 | 5 |
| BE-05 | Notes routes + CRUD | 2 | 3 |
| BE-06 | Journey stage PATCH endpoint | 2 | 1 |
| BE-07 | Male scoring algorithm | 3 | 4 |
| BE-08 | Female scoring algorithm | 3 | 5 |
| BE-09 | Match run endpoint (persist top 10) | 3 | 3 |
| BE-10 | Send/reject match endpoints | 3 | 2 |
| BE-11 | Anthropic AI service (score + intro) | 4 | 5 |
| BE-12 | AI rate limiting middleware | 4 | 2 |
| BE-13 | Pool read endpoints | 3 | 2 |
| BE-14 | Global error handler + logging | 2 | 2 |
| BE-15 | Integration tests (supertest) | 2–4 | 6 |

### 8.3 Database Tasks

| ID | Task | Phase | Est. (hrs) |
|---|---|---|---|
| DB-01 | Drizzle schema for all 5 tables | 1 | 3 |
| DB-02 | Generate + apply initial migration | 1 | 1 |
| DB-03 | RLS policies on all tables | 1 | 2 |
| DB-04 | Seed 100+ pool profiles (TypeScript Faker script) | 1 | 4 |
| DB-05 | Seed 2 matchmaker accounts + 5 demo customers | 1 | 2 |
| DB-06 | Indexes | 1 | 1 |

### 8.4 Infrastructure Tasks

| ID | Task | Phase | Est. (hrs) |
|---|---|---|---|
| INF-01 | Backend Dockerfile | 6 | 2 |
| INF-02 | Frontend Dockerfile (Next.js Standalone) | 6 | 2 |
| INF-03 | docker-compose.yml for local dev | 0 | 2 |
| INF-04 | Render services setup + env vars | 6 | 2 |
| INF-05 | GitHub Actions ci.yml | 0 | 2 |
| INF-06 | GitHub Actions deploy.yml | 6 | 3 |
| INF-07 | GHCR image push from CI | 6 | 2 |
| INF-08 | Render deploy hook integration | 6 | 1 |

### 8.5 Testing Tasks

| ID | Task | Phase | Est. (hrs) |
|---|---|---|---|
| TEST-01 | Unit tests: male scoring algo | 3 | 3 |
| TEST-02 | Unit tests: female scoring algo | 3 | 3 |
| TEST-03 | Unit tests: score normalisation helpers | 3 | 1 |
| TEST-04 | Integration tests: auth endpoints | 2 | 2 |
| TEST-05 | Integration tests: customer CRUD | 2 | 3 |
| TEST-06 | Integration tests: match run endpoint | 3 | 2 |
| TEST-07 | Integration tests: notes CRUD | 2 | 2 |
| TEST-08 | Frontend: React Testing Library — LoginPage | 5 | 2 |
| TEST-09 | Frontend: RTL — CustomerTable render | 5 | 2 |
| TEST-10 | E2E: Playwright — login → view customer → run matches | 7 | 4 |

---

## 9. Security Considerations

### 9.1 Authentication

- Supabase handles password hashing (bcrypt) and JWT signing — no custom auth logic
- JWTs are short-lived (1 hour); frontend uses Supabase `refreshSession()` on expiry
- `access_token` stored in Zustand memory only; `refresh_token` in `httpOnly` cookie (configure Supabase JS with `auth.storage` = cookie)
- HTTPS enforced on all Render services (TLS terminated at edge)

### 9.2 Authorization

- Backend: every protected route verifies JWT, extracts `matchmakerId`, and scopes all DB queries to that matchmaker
- Database: Row Level Security policies as a second enforcement layer
- No matchmaker can read, modify, or delete another matchmaker's customers or notes even with a valid JWT

### 9.3 Input Validation

- All request bodies validated by Zod schemas before reaching controllers
- Zod schemas enforce field types, max lengths, and enum values
- SQL injection is prevented by Drizzle's parameterised queries (never raw string interpolation)
- `express-rate-limit` on all endpoints; stricter limit on AI endpoints

### 9.4 Data Protection

- Supabase connection string (with password) stored only in Render env vars and GitHub Secrets — never in code
- Anthropic API key in env vars; never in frontend bundle
- Profile photos: URLs only stored in DB; actual files would go in Supabase Storage with signed URLs (out of scope v1 but architecture supports it)
- Phone numbers and emails are stored but access is scoped to the assigned matchmaker only
- `.env` is gitignored; `.env.example` contains only placeholder values

---

## 10. Performance Considerations

### 10.1 Caching Strategy

- TanStack Query caches customer list for 5 minutes; invalidated on create/update mutation
- Customer detail cached for 2 minutes
- Match suggestions cached per customer; invalidated when "Send Match" fires
- Backend: no Redis in v1 (Render free tier); AI responses cached in `match_actions` table to avoid repeat LLM calls for the same pair

### 10.2 Query Optimisation

- Dashboard query uses `SELECT` with only required columns (no `SELECT *`): `id, first_name, last_name, date_of_birth, city, marital_status, journey_stage, profile_photo_url`
- Matching algorithm uses a parameterised Drizzle query that filters by gender and `is_active=true` in a single round-trip
- All foreign keys and frequently filtered columns are indexed (see Section 5.3)
- Pool profiles fetched once and scored in memory (100–200 rows is trivial); at 1000+ profiles, move to DB-level scoring with computed columns

### 10.3 Scalability Considerations

For v1 scale (a few matchmakers, ~500 customers, ~200 pool profiles) the current architecture is sufficient. Future scale levers:
- Add Redis (Upstash) for session caching and AI response memoisation
- Move matching scoring to a PostgreSQL function for DB-side execution
- Add Supabase Realtime for live match notification to matchmakers
- Separate AI calls into a background job queue (BullMQ) to avoid blocking HTTP responses

---

## 11. Testing Strategy

### 11.1 Unit Tests (Vitest / Jest)

- **matching.service.ts:** Pure functions; test every scoring dimension individually, edge cases (null fields, same age, equal income)
- **scoring.ts utils:** normalise(), clamp(), ageFromDob()
- **ai.service.ts:** Mock Anthropic SDK; verify prompt construction and response parsing

### 11.2 Integration Tests (Supertest)

- Spin up Express app in test mode with a dedicated test Supabase schema (or transaction-rolled-back test DB)
- Test each endpoint group: auth, customers, notes, matches
- Assert status codes, response shapes, and ownership enforcement (403 on wrong matchmaker)
- Test validation rejection (400) for invalid request bodies

### 11.3 End-to-End Tests (Playwright)

Minimal E2E covering the critical user journey:
1. Navigate to login page → fill credentials → submit → land on dashboard
2. Click first customer → detail page loads with correct name
3. Click "Find Matches" → at least 1 match card appears
4. Click "Send Match" → modal opens with intro email
5. Confirm → toast "Match Sent!" appears

### 11.4 Acceptance Criteria

| Feature | Criterion |
|---|---|
| Login | Valid credentials return 200 + JWT; invalid returns 401 |
| Dashboard | 5 seeded customers visible with correct status tags |
| Detail view | All biodata fields render without empty state errors |
| Matching | At least 5 matches returned for every seeded customer |
| AI label | Label is one of: High Potential / Good Fit / Compatible / Tentative |
| Send match | match_actions row updated to `sent`; toast shown |
| Notes | Create/edit/delete all reflect immediately without page reload |
| Auth guard | Unauthenticated request to `/api/v1/customers` returns 401 |

---

## 12. Deployment Strategy

### 12.1 Development Environment

```bash
# Prerequisites: Node 20, Docker Desktop, pnpm

# 1. Clone repo, copy env
cp .env.example .env   # fill in Supabase keys, Anthropic key

# 2. Install deps
pnpm install           # installs all workspaces

# 3. Run DB migrations and seeds
cd db && npx drizzle-kit push && npx tsx seeds/matchmakers.seed.ts && npx tsx seeds/pool_profiles.seed.ts

# 4. Start local stack
docker compose up      # backend on :3001
cd app/frontend && pnpm dev   # frontend on :3000 (Next.js)
```

### 12.2 Staging Environment

- A separate Render Web Service pointing at the `develop` branch
- Separate Supabase project (staging)
- GitHub Actions deploys staging on every push to `develop`
- Used for QA before merging to `main`

### 12.3 Production Environment

- Render Web Service: `tdc-matchmaker-api` (Docker, backend)
- Render Web Service: `tdc-matchmaker-web` (Next.js Docker standalone service)
- Supabase production project (free tier sufficient for MVP)
- Custom domain optional; Render subdomain used by default
- Environment variables set in Render dashboard (never in code)

### 12.4 CI/CD Pipeline

#### `ci.yml` — Runs on every PR and push to any branch

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend typecheck
      - run: pnpm --filter frontend typecheck
      - run: pnpm --filter backend lint
      - run: pnpm --filter backend test       # unit + integration
      - run: pnpm --filter frontend test      # RTL unit tests
```

#### `deploy.yml` — Runs on push to `main` only

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/ci.yml          # reuse CI job

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push backend image
        uses: docker/build-push-action@v6
        with:
          context: app/backend
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest
      - name: Build and push frontend image
        uses: docker/build-push-action@v6
        with:
          context: app/frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render backend deploy
        run: curl -s "${{ secrets.RENDER_DEPLOY_HOOK_BACKEND }}"
      - name: Trigger Render frontend deploy
        run: curl -s "${{ secrets.RENDER_DEPLOY_HOOK_FRONTEND }}"
```

**Required GitHub Secrets:**

| Secret | Value |
|---|---|
| `RENDER_DEPLOY_HOOK_BACKEND` | Render backend service deploy hook URL |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render frontend static site deploy hook URL |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |

---

## 13. Risks and Mitigation

### 13.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase free tier connection limits (max 60 concurrent) | Low (MVP) | Medium | Use Supabase's PgBouncer pooler URL; connection pool size capped at 5 in Drizzle |
| Anthropic API rate limits during demo | Medium | Medium | Cache AI results in `match_actions` table; never call AI twice for the same pair |
| Docker image too large for Render free tier memory | Low | High | Use `node:20-alpine`; `.dockerignore` excludes `node_modules`, `.git` |
| `drizzle-kit migrate` on cold start races with server startup | Medium | High | Run migration as a separate Render "pre-deploy" command before the app starts |
| TypeScript compilation errors block deploy | Low | High | Typecheck runs in CI before build; deploy only triggers on green CI |

### 13.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `.env` secrets accidentally committed | Low | Critical | `.env` in `.gitignore`; git pre-commit hook (husky) blocks `.env` commits |
| Render free tier spins down after inactivity | High | Low (demo) | Add a `/health` endpoint; document 30-second cold start to reviewers |
| Pool profiles lack diversity making algo look naive | Medium | Medium | Seed script uses @faker-js/faker with explicit distribution across cities, religions, income tiers |

### 13.3 Contingency Plans

- If Anthropic API is unavailable: matching still works with rule-based scoring only; AI label defaults to `Score: {algo_score}/100` and reasoning defaults to pre-defined tag strings
- If Render deploy fails: app still running on previous image (Render keeps last successful deploy)
- If Supabase auth is misconfigured: fall back to manual JWT decode for review (never in production)

---

## 14. Timeline & Milestones

### 14.1 Estimated Effort

| Phase | Duration | Backend hrs | Frontend hrs | DB/Infra hrs | Total |
|---|---|---|---|---|---|
| 0 — Bootstrap | Days 1–2 | 4 | 4 | 4 | **12** |
| 1 — DB Schema & Seeds | Days 3–4 | 0 | 0 | 13 | **13** |
| 2 — Auth & Customer CRUD | Days 5–8 | 24 | 0 | 0 | **24** |
| 3 — Matching Algorithm | Days 9–11 | 16 | 0 | 0 | **16** |
| 4 — AI Integration | Days 12–14 | 12 | 0 | 0 | **12** |
| 5 — Frontend | Days 15–20 | 0 | 42 | 0 | **42** |
| 6 — Docker + CI/CD | Days 21–24 | 0 | 0 | 14 | **14** |
| 7 — Polish & Docs | Days 25–26 | 2 | 7 | 0 | **9** |
| **Total** | **26 days** | **58** | **53** | **31** | **142** |

### 14.2 Major Milestones

| Milestone | Target Day | Deliverable |
|---|---|---|
| **M0** — Repo live, Supabase project created, CI green | Day 2 | Empty repo + green CI badge |
| **M1** — Database ready | Day 4 | All tables + RLS + 100 pool profiles seeded |
| **M2** — Backend API complete | Day 14 | All endpoints working; Postman collection passes |
| **M3** — Frontend MVP | Day 20 | Full flow: login → customer detail → match → send |
| **M4** — Deployed on Render | Day 24 | Live URL + CI/CD pipeline working end-to-end |
| **M5** — Submission ready | Day 26 | README, write-up, demo credentials, GitHub repo |

### 14.3 Dependencies

```
M0 ──► M1 ──► M2 ──► M3 ──► M4 ──► M5
         │      │
         │      └──► AI integration (Phase 4) depends on matching (Phase 3)
         │
         └──► Frontend (Phase 5) can start in parallel after M1
              (mock API responses with MSW until M2 is complete)
```

- Phase 5 (frontend) can begin with Mock Service Worker (MSW) interceptors immediately after Phase 1; real API integration happens after Phase 2 is complete
- Phase 6 (Docker/CI) can be set up in skeleton form during Phase 0 and finalised during Phase 6

---

*End of Implementation Plan — TDC Matchmaker Dashboard v1.0*

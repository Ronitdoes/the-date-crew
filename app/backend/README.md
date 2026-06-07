# TDC Matchmaker Dashboard — Backend Service 🧠

This is the backend server of the **TDC Matchmaker Dashboard**, built with Express, TypeScript, Zod, and Google Gemini API.

---

## 🔑 Environment Variables
The backend loads its configuration from the **unified environment file** at the root of the monorepo (`../../../.env`). 

It loads variables in `src/index.ts` using `dotenv.config` with path resolution:
*   `DATABASE_URL` (PostgreSQL Client Connection)
*   `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (Auth Validation)
*   `GEMINI_API_KEY` (AI Matching Logic & Personalization)
*   `PORT` / `NODE_ENV` (Server setup)

For full definitions, refer to the [Root README.md](../../README.md).

---

## 🛠️ Local Development

### 1. Install Dependencies
Run from the root directory:
```bash
pnpm install
```

### 2. Start the Development Server
From the root directory:
```bash
pnpm dev:backend
```
Or directly from this folder:
```bash
pnpm dev
```

The Express API server will listen on port `3001` (by default) and expose endpoints under `/api/v1`.

### 3. Running Tests
Runs unit and integration tests using Jest and Supertest:
```bash
pnpm test
```

### 4. Build
Compiles TypeScript into javascript (`dist/`):
```bash
pnpm build
```

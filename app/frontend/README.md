# TDC Matchmaker Dashboard — Frontend Client 🖥️

This is the frontend component of the **TDC Matchmaker Dashboard**, built with Next.js 16 (App Router), Tailwind CSS v4, Zustand, React Query, and GSAP.

---

## 🔑 Environment Variables
This sub-workspace does not contain a local `.env` file. Instead, it reads the **unified environment file** at the root of the monorepo (`../../.env`).

Environment loading is defined inside `next.config.ts` using a custom filesystem reader:
*   `NEXT_PUBLIC_SUPABASE_URL`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `NEXT_PUBLIC_API_URL` (Target backend endpoint)

For details, refer to the [Root README.md](../../README.md).

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
pnpm dev:frontend
```
Or directly from this folder:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the client.

### 3. Production Build
To validate type-checking and generate the production next bundle:
```bash
pnpm build
```

---

## 🎨 Key Features
*   **Authentication**: Integrated Supabase SSR authentication client.
*   **Animations**: Stunning custom screen preloader, transition curves, and UI micro-interactions using GSAP and Framer Motion.
*   **State & Query Cache**: Zustand for client-side stores, and TanStack React Query for managing API server sync.


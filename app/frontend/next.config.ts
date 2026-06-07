import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Load env variables from the root .env file (local development only)
// On Vercel/Render, environment variables are injected via the dashboard
// and available directly in process.env — no file reading needed.
function loadRootEnv() {
  const envPath = path.resolve(__dirname, "../../.env");
  if (!fs.existsSync(envPath)) {
    // Not a warning — this is expected on Vercel/Render
    return {};
  }

  const envFileContent = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of envFileContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIdx = trimmed.indexOf("=");
    if (equalIdx === -1) continue;

    const key = trimmed.substring(0, equalIdx).trim();
    let val = trimmed.substring(equalIdx + 1).trim();

    // Remove surrounding quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.substring(1, val.length - 1);
    }

    env[key] = val;
  }

  return env;
}

const rootEnv = loadRootEnv();

const nextConfig: NextConfig = {
  env: {
    // process.env takes priority (set in Vercel/Render dashboard),
    // then fall back to root .env values (local dev),
    // then fall back to safe defaults.
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      rootEnv.NEXT_PUBLIC_SUPABASE_URL ||
      rootEnv.SUPABASE_URL ||
      "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      rootEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      rootEnv.SUPABASE_ANON_KEY ||
      "",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      rootEnv.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001/api/v1",
  },
};

export default nextConfig;

// Refuses a local Cloudflare build when .env files are present: OpenNext bakes their values into the Worker
// (it would ship .env.local's test database name and secrets to production). Production deploys run on
// Cloudflare Workers Builds from GitHub, where these files don't exist. Override: CF_ALLOW_ENV=1.
import { existsSync } from "node:fs";

const found = [".env", ".env.local", ".env.production", ".env.production.local"].filter((f) => existsSync(f));
if (found.length && process.env.CF_ALLOW_ENV !== "1") {
  console.error(`Refusing to build for Cloudflare: ${found.join(", ")} would be baked into the Worker.\nMove them aside (or set CF_ALLOW_ENV=1 for a local-only preview).`);
  process.exit(1);
}

import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import incrementalCache from "./lib/shared-fetch-cache";

// Pages are cached by the edge Worker only (edge/worker.js), so the app keeps no page cache and needs no
// revalidation queue (the Durable Object queue cost $12 in Nov 2026). Fetch results are shared across builds in
// R2 (lib/shared-fetch-cache.ts).
export default defineCloudflareConfig({
  incrementalCache,
});

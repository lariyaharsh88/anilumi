import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import incrementalCache from "./lib/shared-fetch-cache";

// Time-based ISR only (no revalidateTag/revalidatePath), so no tag cache is needed. Pages are cached per build
// (R2 + regional cache); fetch results are shared across builds (lib/shared-fetch-cache.ts).
export default defineCloudflareConfig({
  incrementalCache,
  queue: doQueue,
  enableCacheInterception: true,
});

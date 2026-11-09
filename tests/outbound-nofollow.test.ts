import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Links to other sites are nofollow (affiliate links: "sponsored nofollow"). Allowed exceptions: the embed card,
// which links back to AniLumi from other sites, and the author's own site (rel="me").
const ALLOWED = new Set(["app/embed/[slug]/route.ts", "app/author/harsh-lariya/page.tsx"]);
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(tsx?|mts)$/.test(p) ? [p] : []; });

test("outbound links carry nofollow", () => {
  const bad = [...files("app"), ...files("components")]
    .filter((f) => !ALLOWED.has(f))
    .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/rel="([^"]*noopener[^"]*)"/g)].filter((m) => !m[1].includes("nofollow")).map(() => f));
  assert.deepEqual(bad, []);
});

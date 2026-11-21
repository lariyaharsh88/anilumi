import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// OpenNext on Cloudflare 404s pages prerendered at build time when the route sets dynamicParams = false (live on 21
// Nov 2026 for /characters/[vs]); routes render on first request instead: generateStaticParams() returns [].
test("no route prerenders pages while setting dynamicParams = false", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/page\.tsx$/.test(f)) files.push(p); } };
  walk("app");
  const bad = files.filter((f) => {
    const s = readFileSync(f, "utf8");
    return /dynamicParams\s*=\s*false/.test(s) && /generateStaticParams/.test(s) && !/generateStaticParams\(\)\s*\{\s*return \[\];\s*\}/.test(s);
  });
  assert.deepEqual(bad, []);
});

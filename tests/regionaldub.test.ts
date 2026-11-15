import { test } from "node:test";
import assert from "node:assert/strict";
import { cheapest, dubbedIn, platformsFor, LANG } from "../lib/regionaldub";

const p = (name: string) => ({ name, scope: "", url: "https://example.com" });
const entries = [
  { s: "a", t: "A", ta: { status: "available" as const, confidence: "high" as const, platforms: [p("Crunchyroll"), p("Muse India (YouTube)")] }, te: { status: "none_found" as const, confidence: "high" as const, platforms: [] }, sources: [] },
  { s: "b", t: "B", ta: { status: "available" as const, confidence: "medium" as const, platforms: [p("Crunchyroll")] }, sources: [] },
  { s: "c", t: "C", te: { status: "available" as const, confidence: "high" as const, platforms: [p("Pogo")] }, sources: [] },
];

test("only confirmed dubs in the language; free beats subscription beats TV; platforms by catalogue size", () => {
  const ta = dubbedIn("ta", entries);
  assert.deepEqual(ta.map((d) => d.s).sort(), ["a", "b"]);
  assert.deepEqual(dubbedIn("te", entries).map((d) => d.s), ["c"]);
  assert.equal(cheapest(ta.find((d) => d.s === "a")!), "free");
  assert.equal(cheapest(dubbedIn("te", entries)[0]), "tv");
  assert.deepEqual(platformsFor(ta).map((x) => [x.name, x.titles.length]), [["Crunchyroll", 2], ["Muse India (YouTube)", 1]]);
  assert.equal(LANG.ta.other, "te");
});

test("an anime's Tamil or Telugu dub: its own entry first, else its franchise's", async () => {
  const { regionalFor } = await import("../lib/regionaldub");
  assert.equal(regionalFor({ id: "0", slug: "attack-on-titan" }, "ta")?.s, "attack-on-titan");
  assert.equal(regionalFor({ id: "0", slug: "no-such-anime-xyz" }, "te"), null);
});

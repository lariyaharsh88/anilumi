import { test } from "node:test";
import assert from "node:assert/strict";
import { recentRoles } from "../lib/varecent";
import type { VaRole } from "../lib/anilist";

const role = (id: number, year: number, popularity = 1): VaRole => ({ media: { id, title: `Show ${id}`, format: "TV", year, popularity, score: null, cover: null }, role: "MAIN", characters: [{ id: id * 10, name: `C${id}`, image: null }] });

test("recent roles: airing first, then announced for a later season, then newest by year", () => {
  const roles = [role(1, 2015, 900), role(2, 2026), role(3, 2027), role(4, 2024, 5), role(5, 2024, 50), role(6, 2026)];
  const out = recentRoles(roles, new Map([[2, "Airing now"]]), { "2026-fall": [6], "2027-winter": [3] }, { year: 2026, season: "fall" });
  assert.deepEqual(out.map((r) => [r.role.media.id, r.when]), [[2, "Airing now"], [3, "Coming Winter 2027"], [6, "2026"], [5, "2024"], [4, "2024"], [1, "2015"]]);
});

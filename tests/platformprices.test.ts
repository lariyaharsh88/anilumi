import { test } from "node:test";
import assert from "node:assert/strict";
import { pricesFor, cheapestPlan, startingAt } from "../lib/platformprices";
import { HINDI_PLATFORMS } from "../lib/hindidub";

test("platformprices: every Hindi platform page has a price entry with sources", () => {
  for (const p of HINDI_PLATFORMS) {
    const x = pricesFor(p.slug);
    assert.ok(x, p.slug);
    assert.ok(x.sources.length >= 1, `${p.slug} sources`);
    assert.ok(x.plans.every((pl) => pl.price > 0 && ["month", "quarter", "year"].includes(pl.period)), `${p.slug} plans`);
  }
});

test("platformprices: starting price and best value", () => {
  const cr = pricesFor("crunchyroll")!;
  assert.match(startingAt(cr)!, /^From ₹\d+ a month or ₹[\d,]+ a year$/);
  const best = cheapestPlan(cr)!;
  assert.ok(cr.plans.every((p) => best.price / (best.period === "year" ? 12 : best.period === "quarter" ? 3 : 1) <= p.price / (p.period === "year" ? 12 : p.period === "quarter" ? 3 : 1)));
  assert.equal(startingAt(pricesFor("cartoon-network")!), null);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { hindiItems, itemsFor, leadSlug, type HindiItem } from "../lib/hindialerts";
import { confirmMail, hindiMail, type LeadDoc } from "../lib/emails";
import { LEAD_KINDS } from "../lib/community";
import { hindiDubbed } from "../lib/hindidub";

const item = (slug: string | null, key = `f:${slug}`): HindiItem => ({ key, slug, title: slug ?? "x", url: `/anime/${slug}`, where: "Crunchyroll" });

test("every official dub is an item, keys are unique, free platforms are flagged", () => {
  const items = hindiItems();
  assert.equal(new Set(items.map((i) => i.key)).size, items.length);
  assert.equal(items.filter((i) => i.key.startsWith("f:")).length, hindiDubbed().length);
  assert.ok(items.some((i) => /\(free\)/.test(i.where)));
});

test("a Hindi run counts only once it has started", () => {
  const runs = (now: number) => hindiItems(now).filter((i) => i.key.startsWith("r:")).length;
  assert.equal(runs(Date.parse("2000-01-01")), 0);
  assert.ok(runs(Date.parse("2030-01-01")) >= runs(Date.now()));
});

test("leadSlug reads anime and watch-order pages only", () => {
  assert.equal(leadSlug("/anime/black-clover/episodes"), "black-clover");
  assert.equal(leadSlug("/watch-order/naruto"), "naruto");
  assert.equal(leadSlug("/hindi-dub"), null);
  assert.equal(leadSlug(undefined), null);
});

test("general signups get every new dub; per-anime signups only their franchise", () => {
  const fresh = [item("naruto"), item("bleach"), item(null, "r:x")];
  assert.equal(itemsFor({ animeId: null }, fresh, () => []).length, 3);
  assert.deepEqual(itemsFor({ animeId: "11", page: "/anime/bleach" }, fresh, () => []).map((i) => i.slug), ["bleach"]);
  assert.deepEqual(itemsFor({ animeId: "1", page: "/hindi-dub" }, fresh, () => ["naruto-shippuden", "naruto"]).map((i) => i.slug), ["naruto"]);
  assert.equal(itemsFor({ animeId: "1", page: "/anime/one-piece" }, fresh, () => []).length, 0);
});

const lead: LeadDoc = { email: "fan@example.com", kind: "hindi", animeId: null, token: "tok_abcdefghijklmnopqrst" };

test("hindi is a lead kind with its own confirmation", () => {
  assert.ok(LEAD_KINDS.includes("hindi"));
  assert.equal(confirmMail(lead).subject, "Confirm your Hindi dub alerts");
  assert.equal(confirmMail({ ...lead, animeTitle: "Black Clover" }).subject, "Confirm your Black Clover Hindi dub alert");
});

test("Hindi dub email: one title or a list, escaped, with one-click unsubscribe", () => {
  const one = hindiMail(lead, [{ title: "Dan <Da> Dan", url: "/anime/dandadan", where: "Crunchyroll" }]);
  assert.equal(one.subject, "Dan <Da> Dan is now in Hindi");
  assert.ok(one.html.includes("Dan &lt;Da&gt; Dan") && !one.html.includes("<Da>"));
  assert.match(one.html, /https:\/\/anilumi\.in\/anime\/dandadan/);
  assert.equal(one.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  const two = hindiMail(lead, [{ title: "A", url: "/anime/a", where: "YouTube (free)" }, { title: "B", url: "/anime/b", where: "Netflix" }]);
  assert.equal(two.subject, "2 new Hindi dubbed anime");
  assert.match(two.text, /- B \(Netflix\)/);
});

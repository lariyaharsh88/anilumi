import { test } from "node:test";
import assert from "node:assert/strict";
import { amazonSearch, storeForZone } from "../lib/affiliate";

test("amazon: India's time zone gets amazon.in, everyone else amazon.com", () => {
  assert.equal(storeForZone("Asia/Kolkata"), "in");
  assert.equal(storeForZone("Asia/Calcutta"), "in");
  for (const tz of ["America/New_York", "Europe/London", "Asia/Tokyo", undefined]) assert.equal(storeForZone(tz), "us");
});

test("amazon: books and Blu-ray searches use each store's department", () => {
  const u = new URL(amazonSearch("Attack on Titan Vol. 9"));
  assert.equal(u.host, "www.amazon.com");
  assert.equal(u.searchParams.get("k"), "Attack on Titan Vol. 9");
  assert.equal(u.searchParams.get("i"), "stripbooks");
  assert.equal(new URL(amazonSearch("Naruto", "in")).host, "www.amazon.in");
  assert.equal(new URL(amazonSearch("Naruto blu-ray", "us", "video")).searchParams.get("i"), "movies-tv");
  assert.equal(new URL(amazonSearch("Naruto blu-ray", "in", "video")).searchParams.get("i"), "dvd");
});

test("amazon: the amazon.in tag rides on India links only", () => {
  assert.equal(new URL(amazonSearch("Naruto", "in")).searchParams.get("tag"), "harshmedia98-21");
  assert.equal(new URL(amazonSearch("Naruto", "us")).searchParams.get("tag"), process.env.NEXT_PUBLIC_AMAZON_TAG || null);
});

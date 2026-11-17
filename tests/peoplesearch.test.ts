import { test } from "node:test";
import assert from "node:assert/strict";
import { searchPeople } from "../lib/peoplesearch";

test("people search: characters, voice actors and Hindi voice artists by name", () => {
  const top = (q: string) => searchPeople(q, 3)[0];
  assert.equal(top("gojo")?.name, "Satoru Gojou");
  assert.equal(top("gojo")?.kind, "character");
  assert.ok(top("gojo")?.strong);
  assert.equal(top("nezuko")?.name, "Nezuko Kamado"); // no page of her own: links to the anime
  assert.match(top("nezuko")!.href, /^\/anime\//);
  assert.equal(top("levi ackerman")?.name, "Levi"); // the stored name is part of the query
  assert.equal(top("monkey d luffy")?.name, "Luffy Monkey"); // initials ignored, any word order
  assert.equal(top("kana hanazawa")?.kind, "voice-actor");
  assert.equal(top("rajesh shukla")?.kind, "hindi-voice");
});

test("people search: short queries stay anime searches", () => {
  assert.deepEqual(searchPeople("one"), []);
  assert.deepEqual(searchPeople("aot"), []);
  assert.deepEqual(searchPeople("x"), []);
});

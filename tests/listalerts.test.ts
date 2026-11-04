import { test } from "node:test";
import assert from "node:assert/strict";
import { listLeadsByShow, oncePerEmail } from "../lib/listalerts";

test("list alerts: each show maps to the leads whose synced list has it", () => {
  const leads = [{ email: "a@x.in", listId: "L1" }, { email: "b@x.in", listId: "L2" }, { email: "c@x.in" }, { email: "d@x.in", listId: "gone" }];
  const lists = new Map([["L1", [{ id: "11" }, { id: "22" }, { id: "22" }]], ["L2", [{ id: "22" }]]]);
  const by = listLeadsByShow(leads, lists);
  assert.deepEqual(by.get("11")?.map((l) => l.email), ["a@x.in"]);
  assert.deepEqual(by.get("22")?.map((l) => l.email), ["a@x.in", "b@x.in"]); // a duplicate item counts once
  assert.equal(by.size, 2); // no list id, or a deleted list: nothing
});

test("list alerts: one email per address; the show's own alert lead (and its unsubscribe link) wins", () => {
  const own = [{ email: "a@x.in", token: "alert" }];
  const fromLists = [{ email: "a@x.in", token: "list" }, { email: "b@x.in", token: "list" }];
  assert.deepEqual(oncePerEmail(fromLists, own).map((l) => [l.email, l.token]), [["a@x.in", "alert"], ["b@x.in", "list"]]);
});

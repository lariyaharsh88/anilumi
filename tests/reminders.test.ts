import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmMail, dueReminders, type LeadDoc } from "../lib/emails";

const now = Date.parse("2026-11-15T07:00:00Z");
const hoursAgo = (h: number) => new Date(now - h * 3600_000);
const lead = (email: string, extra: object = {}) => ({ email, status: "pending", ...extra });

test("one reminder: pending a day after the first email (or never emailed), never twice, never test addresses", () => {
  const due = dueReminders([
    lead("old@gmail.com", { confirmSentAt: hoursAgo(30) }),
    lead("never-emailed@gmail.com"),
    lead("fresh@gmail.com", { confirmSentAt: hoursAgo(3) }),
    lead("again@gmail.com", { confirmSentAt: hoursAgo(50), remindedAt: hoursAgo(25) }),
    lead("done@gmail.com", { status: "confirmed", confirmSentAt: hoursAgo(50) }),
    lead("test@example.com"),
  ], now);
  assert.deepEqual(due.map((l) => l.email), ["old@gmail.com", "never-emailed@gmail.com"]);
});

test("the reminder says so, keeps the confirm link, and the first email is unchanged", () => {
  const l: LeadDoc = { email: "fan@gmail.com", kind: "digest", animeId: null, token: "tok_abcdefghijklmnopqrst" };
  const r = confirmMail(l, true), first = confirmMail(l);
  assert.equal(r.subject, "Reminder: confirm your weekly anime digest");
  assert.equal(first.subject, "Confirm your weekly anime digest");
  assert.match(r.html, /api\/lead\/confirm\?t=tok_abcdefghijklmnopqrst/);
  assert.match(r.text, /only reminder/);
  assert.doesNotMatch(first.text, /reminder/i);
});

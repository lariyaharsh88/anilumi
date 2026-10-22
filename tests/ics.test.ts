import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs, foldLine, icsEscape } from "../lib/ics";

test("escapes RFC 5545 special characters", () => {
  assert.equal(icsEscape("a,b;c\\d\ne"), "a\\,b\;c\\\\d\\ne");
});

test("folds long lines at 75 octets without splitting multi-byte characters", () => {
  const folded = foldLine("SUMMARY:" + "葬送のフリーレン".repeat(10));
  for (const part of folded.split("\r\n")) assert.ok(new TextEncoder().encode(part).length <= 75, part);
  assert.equal(folded.replace(/\r\n /g, ""), "SUMMARY:" + "葬送のフリーレン".repeat(10));
});

test("builds timed and all-day events with CRLF endings", () => {
  const ics = buildIcs("My anime", [
    { uid: "12-1181@anilumi.in", summary: "One Piece – Episode 1181", start: "2027-01-03T14:16:00.000Z", durationMin: 24, url: "https://anilumi.in/anime/one-piece/episode/1181" },
    { uid: "99-premiere@anilumi.in", summary: "Premiere: Test", start: "2026-12-31" },
  ], new Date("2026-10-22T00:00:00Z"));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("DTSTART:20270103T141600Z\r\nDTEND:20270103T144000Z"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101"));
  assert.ok(!/[^\r]\n/.test(ics), "every newline is CRLF");
});

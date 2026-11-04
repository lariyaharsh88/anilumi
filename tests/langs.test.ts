import { test } from "node:test";
import assert from "node:assert/strict";
import { languageLine } from "../lib/langs";

test("languageLine names audio and subtitle languages", () => {
  assert.equal(languageLine({ dubs: ["ja", "en"], subs: ["en"] }), "Japanese & English audio, English subtitles");
  assert.equal(languageLine({ dubs: ["ja"], subs: ["en", "es", "pt"] }), "Japanese audio, English, Spanish & Portuguese subtitles");
  assert.equal(languageLine({ dubs: [], subs: [] }), null);
});

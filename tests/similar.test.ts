import { test } from "node:test";
import assert from "node:assert/strict";
import { sharedThemes } from "../lib/similar";

const t = (name: string, rank: number, extra: Partial<{ category: string; isMediaSpoiler: boolean }> = {}) => ({ name, rank, category: extra.category ?? "Theme-Other", isAdult: false, isMediaSpoiler: extra.isMediaSpoiler ?? false });

test("sharedThemes: strong tags both shows carry, strongest first, no spoilers, demographics or vague labels", () => {
  const onePiece = [t("Pirates", 98), t("Found Family", 90), t("Ensemble Cast", 95), t("Shounen", 99, { category: "Demographic" }), t("Time Skip", 80, { isMediaSpoiler: true }), t("Travel", 85), t("Super Power", 70)];
  const other = [t("Pirates", 75), t("Found Family", 88), t("Ensemble Cast", 90), t("Shounen", 95, { category: "Demographic" }), t("Time Skip", 85), t("Travel", 50), t("Super Power", 80)];
  assert.deepEqual(sharedThemes(onePiece, other), ["Found Family", "Pirates", "Super Power"]);
  assert.deepEqual(sharedThemes(onePiece, []), []);
});

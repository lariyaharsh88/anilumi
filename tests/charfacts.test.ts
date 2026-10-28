import { test } from "node:test";
import assert from "node:assert/strict";
import { parseKitsuBio, mergeFacts, factsTitle, ageAnswer } from "../lib/charfacts";

const MIKASA = `Age: 15 Birthdate: February 10 Height: 170 cm (5'7") Weight: 68 kg (150 lbs) Position: 104th Trainees Squad, Scouting Legion Graduation rank: 1st  Mikasa is Eren's adoptive sister.`;

test("parseKitsuBio reads the leading facts block and leaves the prose", () => {
  const { facts, bio } = parseKitsuBio(MIKASA);
  assert.equal(facts.age, "15");
  assert.equal(facts.birthday, "February 10");
  assert.equal(facts.height, `170 cm (5'7")`);
  assert.equal(facts.weight, "68 kg (150 lbs)");
  assert.equal(facts.occupation, "104th Trainees Squad, Scouting Legion");
  assert.equal(bio, "Mikasa is Eren's adoptive sister.");
});

test("parseKitsuBio leaves prose-only bios alone and never shows status", () => {
  assert.deepEqual(parseKitsuBio("Saitama is a hero for fun.").facts, {});
  const { facts } = parseKitsuBio("Status: Deceased Age: 19  Bio text.");
  assert.equal(facts.age, "19");
  assert.equal(Object.values(facts).some((v) => /deceased/i.test(v!)), false);
});

test("mergeFacts prefers AniList's structured fields and keeps display order", () => {
  const out = mergeFacts({ age: "15", gender: "Female", bloodType: null, dateOfBirth: { month: 2, day: 10 }, lines: [{ label: "Height", value: "170 cm" }] }, parseKitsuBio(MIKASA).facts);
  assert.deepEqual(out.map((f) => f.key), ["age", "birthday", "height", "weight", "gender", "occupation"]);
  assert.equal(out.find((f) => f.key === "height")!.value, "170 cm");
  assert.equal(mergeFacts(null, {}).length, 0);
});

test("factsTitle and ageAnswer", () => {
  assert.equal(factsTitle(["age", "height", "birthday"], true), "Age, Height, Birthday & Voice Actor");
  assert.equal(factsTitle(["birthday"], false), "Birthday");
  assert.equal(factsTitle([], false), "");
  assert.equal(ageAnswer("Eren", "15"), "Eren is 15 years old.");
  assert.equal(ageAnswer("Sakura", "12-13 (Part I)"), "Sakura's age is listed as 12-13 (Part I).");
});

test("parseKitsuBio follows facts across paragraphs and cuts at unknown labels", () => {
  const saitama = `Race: Human Age: 25 Height: 175 cm (5'9") Weight: 70 kg (154 lbs) Location: Z-City Occupation: Superhero Level:  C-Class (Rank 388) Affiliation: Hero Association Partner(s): Genos  Saitama is the most powerful hero alive.`;
  const s = parseKitsuBio(saitama);
  assert.equal(s.facts.weight, "70 kg (154 lbs)");
  assert.equal(s.facts.species, "Human");
  assert.equal(s.facts.affiliation, "Hero Association");
  assert.equal(s.bio, "Saitama is the most powerful hero alive.");
  const kakashi = `Age: 26-27 (Part I) Birthday: September 15 Blood Type: O Weight: 67.5 kg  Hair: Silver Rank: Jonin Likes: Icha-Icha series  Like his father, Kakashi is a genius.`;
  const k = parseKitsuBio(kakashi);
  assert.equal(k.facts.blood, "O");
  assert.equal(k.facts.occupation, "Jonin");
  assert.equal(k.bio, "Like his father, Kakashi is a genius.");
});

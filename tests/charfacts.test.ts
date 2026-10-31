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

test("charstats: format mix, years, per-year buckets and cast rank", async () => {
  const { formatMix, yearsActive, perYear, castRank } = await import("../lib/charstats");
  const app = (subtype: string, y: string) => ({ role: "main", anime: { id: y + subtype, subtype, startDate: `${y}-04-01` } });
  const apps = [app("TV", "2013"), app("TV", "2017"), app("movie", "2015"), app("OVA", "2013")];
  assert.deepEqual(formatMix(apps).map((f) => [f.key, f.value]), [["TV", 2], ["movie", 1], ["OVA", 1]]);
  assert.deepEqual(yearsActive(apps), { from: 2013, to: 2017 });
  assert.deepEqual(perYear(apps).map((y) => y.value), [2, 0, 1, 0, 1]);
  const long = perYear([app("TV", "1971"), app("movie", "2019")]);
  assert.equal(long[0].label, "1970s");
  assert.equal(long.reduce((n, y) => n + y.value, 0), 2);
  const r = castRank([{ id: 1, favourites: 5 }, { id: 2, favourites: 50 }, { id: 3, favourites: 20 }], 3);
  assert.deepEqual([r?.rank, r?.of], [2, 3]);
  assert.equal(castRank([{ id: 1, favourites: 5 }], 1), null);
  assert.equal(yearsActive([]), null);
});

test("snapFor matches across word order and middle names, only within the character's anime", async () => {
  const { snapFor, showRanking } = await import("../lib/charsnap");
  const mk = (id: number, n: string, s: string, f: number) => ({ id, n, f, age: null, g: null, bt: null, m: null, d: null, l: [], a: s.length, s, t: s, jp: null, en: null });
  const src = [mk(1, "Luffy Monkey", "one-piece", 300), mk(2, "Zoro Roronoa", "one-piece", 200), mk(3, "Eren Yeager", "attack-on-titan", 500), mk(4, "Eren Yeager", "other-show", 1)];
  assert.equal(snapFor("Monkey D. Luffy", ["one-piece"], src)?.id, 1);
  assert.equal(snapFor("Eren Yeager", ["attack-on-titan"], src)?.id, 3);
  assert.equal(snapFor("Monkey D. Luffy", ["attack-on-titan"], src), null);
  assert.equal(snapFor("Luffy", ["one-piece"], src), null);
  assert.deepEqual(showRanking(src[0], src).map((c) => c.id), [1, 2]);
});

test("editor notes: 100 entries, 'try next' points at other noted shows, no self-links", async () => {
  const { NOTES } = await import("../data/notes");
  const slugs = Object.keys(NOTES);
  assert.equal(slugs.length, 100);
  for (const [s, n] of Object.entries(NOTES)) {
    assert.ok(n.take.length > 60 && n.take.length < 400, s);
    assert.equal(n.next.length, 3, s);
    for (const [x] of n.next) { assert.ok(slugs.includes(x), `${s} → ${x}`); assert.notEqual(x, s); }
  }
});

test("zodiac signs change on the right days", async () => {
  const { zodiac } = await import("../lib/charfacts");
  assert.equal(zodiac(3, 30), "Aries"); // Eren
  assert.equal(zodiac(1, 19), "Capricorn");
  assert.equal(zodiac(1, 20), "Aquarius");
  assert.equal(zodiac(12, 21), "Sagittarius");
  assert.equal(zodiac(12, 22), "Capricorn");
  assert.equal(zodiac(7, 1), "Cancer"); // Touka
  assert.equal(zodiac(13, 1), null);
});

test("aliasList merges sources without repeats or the character's own names", async () => {
  const { aliasList } = await import("../lib/charfacts");
  assert.deepEqual(aliasList("Nate River", "ネイト リバー", ["Near", "N"], ["near", "Nate River", " ", "Near (ニア)"]), ["Near", "N"]);
  assert.deepEqual(aliasList("Eren Yeager", null, ["Shi ni Isogi Yarou (死に急ぎ野郎)"]), ["Shi ni Isogi Yarou"]);
  assert.deepEqual(aliasList("Eren Yeager", null, [], ["Eren Jaeger", "Eren Jäger", "x".repeat(41), "A", "B", "C"]), ["Eren Jaeger", "Eren Jäger", "A", "B"]);
});

test("quickAnswer reads naturally and quotes ranges as listed", async () => {
  const { quickAnswer } = await import("../lib/charfacts");
  assert.equal(
    quickAnswer({ name: "Eren Yeager", gender: "Male", role: "main", anime: "Attack on Titan", age: "15", height: "170 cm (5'7\")", birthday: "March 30", sign: "Aries", jp: "Yuuki Kaji", en: "Bryce Papenbrook" }),
    "Eren Yeager is a main character in Attack on Titan. He is 15 years old and 170 cm (5'7\") tall. His birthday is March 30, which makes him an Aries. He is voiced by Yuuki Kaji in Japanese and by Bryce Papenbrook in the English dub.",
  );
  assert.equal(
    quickAnswer({ name: "Sakura Haruno", gender: "Female", role: "main", anime: "Naruto", age: "12-17", height: "149cm (I), 161cm (II)" }),
    "Sakura Haruno is a main character in Naruto. Her age is listed as 12-17. Her height is listed as 149cm (I), 161cm (II).",
  );
  assert.equal(quickAnswer({ name: "Ryuk", height: "170 cm (5'7\") - 183 cm (6'0\")", birthday: "December 1", sign: "Sagittarius" }),
    "Ryuk's height is listed as 170 cm (5'7\") - 183 cm (6'0\"). Ryuk's birthday is December 1, which makes them a Sagittarius.");
});

test("debutAndLatest picks first and most recent dated titles", async () => {
  const { debutAndLatest } = await import("../lib/charstats");
  const a = (id: string, startDate: string | null) => ({ anime: { id, startDate } });
  const r = debutAndLatest([a("2", "2017-04-01"), a("1", "2013-04-07"), a("x", null), a("3", "2023-03-04")])!;
  assert.deepEqual([r.first.anime.id, r.latest?.anime.id], ["1", "3"]);
  assert.equal(debutAndLatest([a("1", "2013-04-07")])!.latest, null);
  assert.equal(debutAndLatest([a("1", null)]), null);
});

test("heightCm reads cm, ranges, per-arc lists and feet", async () => {
  const { heightCm, ageNum } = await import("../lib/charfacts");
  assert.equal(heightCm(`170 cm (5'7") - 183 cm (6'0")`), 183);
  assert.equal(heightCm("149cm (I), 161cm (II)"), 161);
  assert.equal(heightCm("~300cm (~9'10\")"), 300);
  assert.equal(heightCm("177.5 cm (5'10\")"), 177.5);
  assert.equal(heightCm("154 cm (5’1”)"), 154);
  assert.equal(heightCm(`5'7"`), 170);
  assert.equal(heightCm("tall"), null);
  assert.equal(heightCm(null), null);
  assert.deepEqual(["15", "17-18", "800+", "unknown", null].map(ageNum), [15, 17, 800, null, null]);
});

test("characterTable needs enough people and data, sorted by favourites", async () => {
  const { characterTable } = await import("../lib/charsnap");
  const mk = (id: number, f: number, h: string | null, age: string | null = null) => ({ id, n: `C${id}`, f, age, g: null, bt: null, m: null, d: null, l: h ? [["Height", h]] as [string, string][] : [], a: 1, s: "show", t: "Show", jp: null, en: null });
  const four = [mk(1, 10, "170 cm"), mk(2, 30, "160 cm"), mk(3, 20, "150 cm"), mk(4, 5, null)];
  assert.deepEqual(characterTable("show", four)!.map((r) => [r.c.id, r.cm]), [[2, 160], [3, 150], [1, 170], [4, null]]);
  assert.equal(characterTable("show", four.slice(0, 3)), null); // too few people
  assert.equal(characterTable("show", [mk(1, 1, null), mk(2, 1, null), mk(3, 1, "150 cm"), mk(4, 1, null)]), null); // too little data
  assert.ok(characterTable("show", [mk(1, 1, null, "15"), mk(2, 1, null, "16"), mk(3, 1, null, "17"), mk(4, 1, null)]));
  assert.equal(characterTable("other", four), null);
});

"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { makeName, toKatakana, type Gender, type JpName } from "@/lib/jpnames";

type Full = { surname: JpName; given: JpName };

/** The generator (ten names at a time, by gender) and "your name in Japanese" (katakana). All in the browser. */
export default function JapaneseNameTool() {
  const [g, setG] = useState<Gender>("any");
  const [names, setNames] = useState<Full[]>([]);
  const [mine, setMine] = useState("");
  // Drawn after hydration: random names in the server HTML would differ from the browser's.
  const roll = (gender: Gender) => setNames(Array.from({ length: 10 }, () => makeName(gender)));
  useEffect(() => roll("any"), []);
  const kana = mine.trim() ? toKatakana(mine) : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Names for">
          {(["any", "boy", "girl"] as const).map((x) => (
            <button key={x} type="button" aria-pressed={g === x} onClick={() => { setG(x); roll(x); }} className={`chip ${g === x ? "chip-active" : ""}`}>{x === "any" ? "Any" : x === "boy" ? "Boy names" : "Girl names"}</button>
          ))}
          <button type="button" onClick={() => { roll(g); track("generate", { tool: "japanese-name" }); }} className="btn-outline ml-auto">🎲 New names</button>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {names.map((n, i) => (
            <li key={`${n.surname.romaji}-${n.given.romaji}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
              <span><span className="text-xl font-bold text-ink" lang="ja">{n.surname.kanji} {n.given.kanji}</span> <span className="text-sm text-ink/85">{n.surname.romaji} {n.given.romaji}</span></span>
              <span className="text-xs text-muted">{n.surname.meaning} · {n.given.meaning}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Surname first, as in Japan. Meanings are of the kanji shown; most names can be written with other kanji too.</p>
      </div>

      <div className="card p-5">
        <label htmlFor="my-name" className="font-semibold text-ink">Your name in Japanese</label>
        <p className="mt-1 text-xs text-muted">Foreign names are written in katakana. Type yours:</p>
        <input id="my-name" value={mine} onChange={(e) => setMine(e.target.value)} onBlur={() => mine.trim() && track("generate", { tool: "name-katakana" })} placeholder="e.g. Harsh Lariya" className="input mt-3" autoComplete="off" maxLength={40} />
        {kana && (
          <div className="mt-4 rounded-xl bg-white/[.05] p-4 text-center">
            <p className="text-4xl font-bold text-ink" lang="ja">{kana}</p>
            <p className="mt-2 text-xs text-muted">An approximate spelling: Japanese spells foreign names by sound, so a native speaker may write it slightly differently.</p>
          </div>
        )}
      </div>
    </div>
  );
}

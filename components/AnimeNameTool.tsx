"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { VIBES, makeAnimeName, type AnimeName, type Vibe } from "@/lib/animenames";
import type { Gender } from "@/lib/jpnames";

/** Eight anime character names at a time, by vibe and gender. All in the browser. */
export default function AnimeNameTool() {
  const [vibe, setVibe] = useState<Vibe>("hero");
  const [g, setG] = useState<Gender>("any");
  const [names, setNames] = useState<AnimeName[]>([]);
  // Drawn after hydration: random names in the server HTML would differ from the browser's.
  const roll = (v: Vibe, gender: Gender) => setNames(Array.from({ length: 8 }, () => makeAnimeName(v, gender)));
  useEffect(() => roll("hero", "any"), []);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Character vibe">
        {VIBES.map((v) => <button key={v.key} type="button" aria-pressed={vibe === v.key} onClick={() => { setVibe(v.key); roll(v.key, g); }} className={`chip ${vibe === v.key ? "chip-active" : ""}`}>{v.emoji} {v.label}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Names for">
        {(["any", "boy", "girl"] as const).map((x) => <button key={x} type="button" aria-pressed={g === x} onClick={() => { setG(x); roll(vibe, x); }} className={`chip ${g === x ? "chip-active" : ""}`}>{x === "any" ? "Any" : x === "boy" ? "Male" : "Female"}</button>)}
        <button type="button" onClick={() => { roll(vibe, g); track("generate", { tool: "anime-name", vibe }); }} className="btn-outline ml-auto">🎲 New names</button>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {names.map((n, i) => (
          <li key={`${n.surname.romaji}-${n.given.romaji}-${i}`} className="py-3">
            <p className="flex flex-wrap items-baseline gap-x-3"><span className="text-xl font-bold text-ink" lang="ja">{n.surname.kanji} {n.given.kanji}</span><span className="font-semibold text-ink/90">{n.given.romaji} {n.surname.romaji}, <span className="text-violet-2">{n.epithet}</span></span></p>
            <p className="mt-0.5 text-xs text-muted">Power: {n.power} · Name means {n.surname.meaning} · {n.given.meaning}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Real Japanese names with a common kanji spelling. In English the given name usually comes first; in Japan the surname does.</p>
    </div>
  );
}

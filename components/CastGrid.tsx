import Link from "@/components/Link";
import Image from "next/image";
import { vaPath, type CastEntry, type Va } from "@/lib/anilist";

function Person({ va, lang, align = "right" }: { va: Va | null; lang: string; align?: "left" | "right" }) {
  if (!va) return <span className={`text-xs text-muted ${align === "right" ? "text-right" : ""}`}>No {lang} voice listed</span>;
  return (
    <Link href={vaPath(va)} className={`group flex min-w-0 items-center gap-2.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-bg-2">{va.image && <Image src={va.image} alt="" fill sizes="40px" className="object-cover" />}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{va.name}</span>
        <span className="block text-[11px] uppercase tracking-wider text-muted">{lang}</span>
      </span>
    </Link>
  );
}

/** Character on the left, Japanese voice on the right, English dub underneath. */
export default function CastGrid({ entries }: { entries: CastEntry[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {entries.map((e) => (
        <li key={e.character.id} className="card p-3 transition duration-300 hover:border-white/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-bg-2">{e.character.image && <Image src={e.character.image} alt="" fill sizes="48px" className="object-cover" />}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{e.character.name}</span>
                <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${e.role === "MAIN" ? "bg-accent/20 text-accent-2" : "bg-white/5 text-muted"}`}>{e.role.toLowerCase()}</span>
              </span>
            </div>
            <Person va={e.jp} lang="Japanese" />
          </div>
          {(e.en || e.otherDubs > 0) && (
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-2">
              <span className="text-xs text-muted">{e.otherDubs > 0 ? `+${e.otherDubs} other dub${e.otherDubs === 1 ? "" : "s"}` : ""}</span>
              {e.en && <Person va={e.en} lang="English dub" />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

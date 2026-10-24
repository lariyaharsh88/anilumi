import { themeLabel, youtubeSearch, spotifySearch, type Theme } from "@/lib/themes";

/** Openings/endings as numbered cards with song, artist, episode range and listen links. */
export default function ThemeList({ title, themes, atSlug }: { title: string; themes: Theme[]; atSlug: string }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {themes.map((t) => {
        const q = `${title} ${t.type}${t.sequence} ${t.song || ""} ${t.artists[0] || ""}`.trim();
        const eps = t.entries.map((e) => e.episodes).filter(Boolean);
        return (
          <li key={t.slug} className="card flex gap-4 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl text-lg font-black ${t.type === "OP" ? "bg-accent/15 text-accent-2" : "bg-violet/15 text-violet-2"}`} aria-hidden>{t.type}{t.sequence}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{themeLabel(t)}{eps.length ? ` · ep ${eps.join(", ")}` : ""}</p>
              <p className="mt-0.5 truncate text-lg font-bold text-ink">{t.song ? `“${t.song}”` : "Untitled"}</p>
              {t.artists.length > 0 && <p className="truncate text-sm text-ink/75">by {t.artists.join(", ")}</p>}
              <p className="mt-2.5 flex flex-wrap gap-2 text-xs">
                <a href={youtubeSearch(q)} target="_blank" rel="noopener nofollow" className="chip">▶ YouTube</a>
                {t.song && <a href={spotifySearch(`${t.song} ${t.artists[0] || ""}`)} target="_blank" rel="noopener nofollow" className="chip">♫ Spotify</a>}
                <a href={`https://animethemes.moe/anime/${atSlug}/${t.slug}`} target="_blank" rel="noopener nofollow" className="chip">AnimeThemes</a>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

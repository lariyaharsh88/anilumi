"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import { toMatches, traceError, timecode, CONFIDENT, type Match, type TraceHit } from "@/lib/scene";
import { track } from "@/lib/track";

const API = "https://api.trace.moe";
type Mapped = Record<string, { slug: string; title: string; poster: string | null; episodes: number | null }>;
type State =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string }
  | { kind: "done"; matches: Match[]; hiddenAdult: number; mapped: Mapped };

/** Shrink to 640px wide JPEG before upload: faster, and trace.moe matches on small frames anyway. */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 640 / bmp.width);
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b || file), "image/jpeg", 0.9));
  } catch {
    return file;
  }
}

/**
 * "What anime is this?": the visitor's browser calls trace.moe directly (it allows our origin), so
 * every visitor uses their own free quota rather than sharing one server-wide limit.
 */
export default function SceneSearch() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [quota, setQuota] = useState<{ used: number; total: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshQuota = useCallback(() => {
    fetch(`${API}/me`).then((r) => r.json()).then((d: { quota: number; quotaUsed: number }) => setQuota({ used: d.quotaUsed, total: d.quota })).catch(() => {});
  }, []);
  useEffect(refreshQuota, [refreshQuota]);

  const run = useCallback(async (req: () => Promise<Response>) => {
    setState({ kind: "busy" });
    try {
      const res = await req();
      const body = (await res.json().catch(() => ({}))) as { error?: string; result?: TraceHit[] };
      if (!res.ok || body.error) { setState({ kind: "error", message: traceError(res.status, body.error) }); return; }
      const { matches, hiddenAdult } = toMatches(body.result || []);
      let mapped: Mapped = {};
      if (matches.length) {
        const m = await fetch(`/api/anilist-map?ids=${[...new Set(matches.map((x) => x.anilistId))].join(",")}`).then((r) => r.json()).catch(() => ({ map: {} }));
        mapped = m.map || {};
      }
      setState({ kind: "done", matches, hiddenAdult, mapped });
      track("scene_search", { found: matches.length > 0, top_similarity: matches[0] ? Math.round(matches[0].similarity * 100) : 0 });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the search service. Check your connection and try again." });
    } finally {
      refreshQuota();
    }
  }, [refreshQuota]);

  const searchFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (!/^(image|video)\//.test(file.type)) { setState({ kind: "error", message: "That isn't an image. Paste or upload a screenshot." }); return; }
    if (file.size > 25 * 1024 * 1024) { setState({ kind: "error", message: traceError(413) }); return; }
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
    const blob = await shrink(file);
    run(() => fetch(`${API}/search?anilistInfo&cutBorders`, { method: "POST", body: blob, headers: { "Content-Type": blob.type || "image/jpeg" } }));
  }, [run]);

  const searchUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) { setState({ kind: "error", message: "Enter a full image link starting with https://" }); return; }
    setPreview(u);
    run(() => fetch(`${API}/search?anilistInfo&cutBorders&url=${encodeURIComponent(u)}`));
  };

  // Ctrl/Cmd+V anywhere on the page pastes a screenshot.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) { e.preventDefault(); searchFile(item.getAsFile()); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [searchFile]);

  const busy = state.kind === "busy";
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      <div className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); searchFile(e.dataTransfer.files?.[0]); }}
          className={`relative grid min-h-60 place-items-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? "border-accent bg-accent/10" : "border-line bg-bg-2/60"}`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your screenshot" className="absolute inset-0 h-full w-full object-contain opacity-40" />
          ) : null}
          <div className="relative">
            <p className="text-4xl" aria-hidden>🔍</p>
            <p className="mt-2 font-semibold text-ink">{busy ? "Searching 30,000+ hours of anime…" : "Drop a screenshot here"}</p>
            <p className="mt-1 text-sm text-muted">or paste it with <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">Ctrl</kbd>/<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">⌘</kbd>+<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">V</kbd></p>
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="btn-primary mt-4">{busy ? "Searching…" : "Choose image"}</button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => searchFile(e.target.files?.[0])} />
          </div>
        </div>

        <form onSubmit={searchUrl} className="flex gap-2">
          <label className="sr-only" htmlFor="scene-url">Image link</label>
          <input id="scene-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image link" className="input min-w-0 flex-1" inputMode="url" autoComplete="off" />
          <button type="submit" disabled={busy || !url.trim()} className="btn-outline">Search</button>
        </form>

        <p className="text-xs leading-5 text-muted">
          Works best with a clean, full-frame screenshot from the episode itself (no fan art, edits or heavy crops).
          {quota ? ` You have ${Math.max(0, quota.total - quota.used)} of ${quota.total} free searches left this month.` : ""}
          {" "}Your image goes straight to <a href="https://trace.moe" target="_blank" rel="noopener" className="underline">trace.moe</a> for matching; AniLumi doesn&apos;t store it.
        </p>
      </div>

      <div aria-live="polite">
        {state.kind === "idle" && (
          <div className="card p-6 text-sm leading-6 text-muted">
            <p className="font-semibold text-ink">How it works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Take a screenshot of the scene you&apos;re curious about.</li>
              <li>Paste, drop or upload it.</li>
              <li>Get the anime, the episode and the exact moment it appears, with a preview clip.</li>
            </ol>
          </div>
        )}
        {state.kind === "busy" && <div className="card animate-pulse p-6 text-sm text-muted">Matching your frame against every episode…</div>}
        {state.kind === "error" && <div className="card border-accent/40 bg-accent/10 p-5 text-sm text-ink" role="alert">{state.message}</div>}
        {state.kind === "done" && state.matches.length > 0 && state.matches[0].similarity < CONFIDENT && (
          <p className="mb-3 rounded-lg bg-white/5 p-3 text-sm text-ink/85">No confident match. These are the closest guesses; try a cleaner frame from the same scene for a better result.</p>
        )}
        {state.kind === "done" && (
          state.matches.length ? (
            <ol className="space-y-3">
              {(state.matches[0].similarity >= CONFIDENT ? state.matches.filter((m) => m.similarity >= CONFIDENT) : state.matches).map((m, i) => {
                const page = state.mapped[String(m.anilistId)];
                const sure = m.similarity >= CONFIDENT;
                return (
                  <li key={`${m.anilistId}-${m.episode}`} className={`card overflow-hidden ${i === 0 && sure ? "border-accent/50" : ""}`}>
                    <div className="grid gap-0 sm:grid-cols-[240px_1fr]">
                      <video src={`${m.video}&size=m&mute`} poster={m.image} autoPlay={i === 0} muted loop playsInline controls={i !== 0} className="aspect-video w-full bg-black object-cover" />
                      <div className="min-w-0 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-bold ${m.similarity >= 0.9 ? "bg-emerald-500/20 text-emerald-300" : sure ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-muted"}`}>{(m.similarity * 100).toFixed(1)}% match</span>
                          {!sure && <span className="text-xs text-muted">Low confidence</span>}
                          {i === 0 && sure && <span className="text-xs font-semibold text-accent-2">Best match</span>}
                        </div>
                        <p className="mt-2 truncate text-lg font-bold text-ink">{page?.title || m.title}</p>
                        {m.native && <p className="truncate text-sm text-ink/60">{m.native}</p>}
                        <p className="mt-1 text-sm text-ink/85">{m.episode ? `Episode ${m.episode}` : "Movie / special"} · at <strong>{timecode(m.at)}</strong></p>
                        <p className="mt-3 flex flex-wrap gap-2 text-sm">
                          {page ? (
                            <>
                              <Link href={`/anime/${page.slug}`} className="chip chip-active">Open on AniLumi</Link>
                              {m.episode && <Link href={`/anime/${page.slug}/episode/${m.episode}`} className="chip">Episode {m.episode} page</Link>}
                              <Link href={`/anime/${page.slug}/next-season`} className="chip">Next season?</Link>
                            </>
                          ) : (
                            <a href={`https://anilist.co/anime/${m.anilistId}`} target="_blank" rel="noopener" className="chip">View on AniList</a>
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
              {state.matches[0].similarity >= CONFIDENT && state.matches.some((m) => m.similarity < CONFIDENT) && (
                <li>
                  <details className="group text-sm text-muted">
                    <summary className="cursor-pointer select-none hover:text-ink">Other, less likely guesses ({state.matches.filter((m) => m.similarity < CONFIDENT).length})</summary>
                    <ul className="mt-2 space-y-1">
                      {state.matches.filter((m) => m.similarity < CONFIDENT).map((m) => {
                        const page = state.mapped[String(m.anilistId)];
                        return (
                          <li key={`${m.anilistId}-${m.episode}`}>
                            {(m.similarity * 100).toFixed(0)}% · {page ? <Link href={`/anime/${page.slug}`} className="text-violet underline decoration-violet/40 underline-offset-2 hover:text-violet-2 hover:decoration-violet-2">{page.title}</Link> : m.title}{m.episode ? `, episode ${m.episode}` : ""} at {timecode(m.at)}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              )}
              {state.hiddenAdult > 0 && <li className="text-xs text-muted">{state.hiddenAdult} adult-only result{state.hiddenAdult === 1 ? " was" : "s were"} hidden.</li>}
            </ol>
          ) : (
            <div className="card p-5 text-sm text-muted">No match found. Try a different frame from the same scene, ideally without subtitles or overlays.</div>
          )
        )}
      </div>
    </div>
  );
}

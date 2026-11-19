"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import LeadForm from "@/components/LeadForm";
import { toMatches, traceError, timecode, CONFIDENT, type Match, type TraceHit } from "@/lib/scene";
import { track } from "@/lib/track";

const API = "https://api.trace.moe";
type Mapped = Record<string, { id?: string; status?: string; slug: string; title: string; poster: string | null; episodes: number | null; watchOrder?: boolean; hindi?: string | null }>;
type State =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string }
  | { kind: "done"; matches: Match[]; hiddenAdult: number; mapped: Mapped };

type Source = "image" | "video" | "url" | "paste";
type Clip = { src: string; duration: number; at: number };

/** A video frame on a canvas as a JPEG at most 1280px wide. The clip itself never leaves the browser. */
function frameToBlob(v: HTMLVideoElement): Promise<Blob | null> {
  const scale = Math.min(1, 1280 / (v.videoWidth || 1280));
  const c = document.createElement("canvas");
  c.width = Math.round((v.videoWidth || 1280) * scale);
  c.height = Math.round((v.videoHeight || 720) * scale);
  c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", 0.9));
}

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
  const [clip, setClip] = useState<Clip | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const refreshQuota = useCallback(() => {
    fetch(`${API}/me`).then((r) => r.json()).then((d: { quota: number; quotaUsed: number }) => setQuota({ used: d.quotaUsed, total: d.quota })).catch(() => {});
  }, []);
  useEffect(refreshQuota, [refreshQuota]);

  const run = useCallback(async (req: () => Promise<Response>, source: Source) => {
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
      track("scene_search", { source, found: matches.length > 0, top_similarity: matches[0] ? Math.round(matches[0].similarity * 100) : 0 });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the search service. Check your connection and try again." });
    } finally {
      refreshQuota();
    }
  }, [refreshQuota]);

  const postImage = useCallback((blob: Blob, source: Source) => run(() => fetch(`${API}/search?anilistInfo&cutBorders`, { method: "POST", body: blob, headers: { "Content-Type": blob.type || "image/jpeg" } }), source), [run]);

  // A video goes to the frame picker instead: scrub to the moment, then search that one frame.
  const openClip = useCallback((file: File) => {
    setClip((old) => { if (old) URL.revokeObjectURL(old.src); return { src: URL.createObjectURL(file), duration: 0, at: 0 }; });
    setPreview((old) => { if (old?.startsWith("blob:")) URL.revokeObjectURL(old); return null; });
    setState({ kind: "idle" });
  }, []);

  const searchFile = useCallback(async (file: File | null | undefined, source: Source = "image") => {
    if (!file) return;
    if (file.type.startsWith("video/")) { openClip(file); return; }
    if (!file.type.startsWith("image/")) { setState({ kind: "error", message: "That isn't an image or a video. Paste or upload a screenshot, or choose a clip." }); return; }
    if (file.size > 25 * 1024 * 1024) { setState({ kind: "error", message: traceError(413) }); return; }
    setClip((old) => { if (old) URL.revokeObjectURL(old.src); return null; });
    setPreview((old) => { if (old?.startsWith("blob:")) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
    postImage(await shrink(file), source);
  }, [openClip, postImage]);

  const searchFrame = async () => {
    const v = videoRef.current;
    if (!v) return;
    const blob = await frameToBlob(v).catch(() => null);
    if (!blob) { setState({ kind: "error", message: "Couldn't read that frame. Try another moment, or take a screenshot instead." }); return; }
    postImage(blob, "video");
  };

  const runUrl = useCallback((u: string) => {
    setPreview(u);
    run(() => fetch(`${API}/search?anilistInfo&cutBorders&url=${encodeURIComponent(u)}`), "url");
  }, [run]);

  const searchUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) { setState({ kind: "error", message: "Enter a full image link starting with https://" }); return; }
    runUrl(u);
  };

  // ?url=<image link> (the Chrome extension's right-click menu) searches straight away. Read in the browser, so the
  // page itself stays the same cached HTML for everyone.
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("url")?.trim();
    if (u && /^https:\/\/\S+$/i.test(u) && u.length < 2048) { setUrl(u); runUrl(u); }
    // Once, on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl/Cmd+V anywhere on the page pastes a screenshot.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) { e.preventDefault(); searchFile(item.getAsFile(), "paste"); }
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
            <p className="mt-2 font-semibold text-ink">{busy ? "Searching 30,000+ hours of anime…" : "Drop a screenshot or a clip here"}</p>
            <p className="mt-1 text-sm text-muted">or paste it with <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">Ctrl</kbd>/<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">⌘</kbd>+<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">V</kbd></p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="btn-primary">{busy ? "Searching…" : "Choose image"}</button>
              <button type="button" disabled={busy} onClick={() => videoFileRef.current?.click()} className="btn-outline">🎬 Video clip</button>
              {/* Phones: photograph the TV or laptop screen directly (crop to the picture for the best match). */}
              <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()} className="btn-outline md:hidden">📷 Take a photo</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => searchFile(e.target.files?.[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => searchFile(e.target.files?.[0])} />
            <input ref={videoFileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) openClip(f); e.target.value = ""; }} />
          </div>
        </div>

        {clip && (
          <div className="card space-y-3 p-3">
            <p className="text-sm font-semibold text-ink">Pick the moment to search</p>
            <video
              ref={videoRef}
              src={clip.src}
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => { const d = e.currentTarget.duration || 0; e.currentTarget.currentTime = Math.min(1, d / 2); setClip((c) => (c ? { ...c, duration: d, at: Math.min(1, d / 2) } : c)); }}
              className="aspect-video w-full rounded-lg bg-black object-contain"
            />
            <label className="block text-xs text-muted" htmlFor="clip-at">Frame at {timecode(clip.at)}{clip.duration ? ` of ${timecode(clip.duration)}` : ""}</label>
            <input
              id="clip-at"
              type="range"
              min={0}
              max={clip.duration || 0}
              step={0.04}
              value={clip.at}
              onChange={(e) => { const t = Number(e.target.value); if (videoRef.current) videoRef.current.currentTime = t; setClip((c) => (c ? { ...c, at: t } : c)); }}
              className="w-full accent-violet"
              disabled={!clip.duration}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy || !clip.duration} onClick={searchFrame} className="btn-primary">{busy ? "Searching…" : "Search this frame"}</button>
              <button type="button" onClick={() => setClip((c) => { if (c) URL.revokeObjectURL(c.src); return null; })} className="btn-outline">Remove clip</button>
            </div>
            <p className="text-xs leading-5 text-muted">The clip stays on your device: only the one frame you pick is sent for matching. Pick a clear moment without captions over the picture.</p>
          </div>
        )}

        <form onSubmit={searchUrl} className="flex gap-2">
          <label className="sr-only" htmlFor="scene-url">Image link</label>
          <input id="scene-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image link" className="input min-w-0 flex-1" inputMode="url" autoComplete="off" />
          <button type="submit" disabled={busy || !url.trim()} className="btn-outline">Search</button>
        </form>

        <p className="text-xs leading-5 text-muted">
          Works best with a clean, full-frame screenshot from the episode itself (no fan art, edits or heavy crops).
          {quota ? ` You have ${Math.max(0, quota.total - quota.used)} of ${quota.total} free searches left this month.` : ""}
          {" "}Your image goes straight to <a href="https://trace.moe" target="_blank" rel="noopener nofollow" className="underline">trace.moe</a> for matching; AniLumi doesn&apos;t store it.
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
          <div className="mb-3 rounded-lg bg-white/5 p-3 text-sm text-ink/85"><p>No confident match. These are the closest guesses.</p><MatchTips /></div>
        )}
        {state.kind === "done" && (
          state.matches.length ? (
            <ol className="space-y-3">
              {(state.matches[0].similarity >= CONFIDENT ? state.matches.filter((m) => m.similarity >= CONFIDENT) : state.matches).slice(0, 3).map((m, i) => {
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
                              {/* What people ask once they know the title: where to watch it, in what order, in Hindi. */}
                              <Link href={`/anime/${page.slug}#watch`} className="chip chip-active" onClick={() => track("scene_result_click", { to: "watch" })}>▶ Where to watch</Link>
                              {page.hindi && <Link href={page.hindi} className="chip" onClick={() => track("scene_result_click", { to: "hindi" })}>🇮🇳 Hindi dub</Link>}
                              {page.watchOrder && <Link href={`/watch-order/${page.slug}`} className="chip" onClick={() => track("scene_result_click", { to: "watch-order" })}>Watch order</Link>}
                              {m.episode && <Link href={`/anime/${page.slug}/episode/${m.episode}`} className="chip" onClick={() => track("scene_result_click", { to: "episode" })}>Episode {m.episode} page</Link>}
                              <Link href={`/anime/${page.slug}/next-season`} className="chip" onClick={() => track("scene_result_click", { to: "next-season" })}>Next season?</Link>
                            </>
                          ) : (
                            <a href={`https://anilist.co/anime/${m.anilistId}`} target="_blank" rel="noopener nofollow" className="chip">View on AniList</a>
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
              {(() => {
                // The three best are shown in full above; anything else goes in the "less likely" list.
                const shown = (state.matches[0].similarity >= CONFIDENT ? state.matches.filter((m) => m.similarity >= CONFIDENT) : state.matches).slice(0, 3);
                const rest = state.matches.filter((m) => !shown.includes(m));
                if (!rest.length) return null;
                return (
                <li>
                  <details className="group text-sm text-muted">
                    <summary className="cursor-pointer select-none hover:text-ink">Other, less likely guesses ({rest.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {rest.map((m) => {
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
                );
              })()}
              {(() => {
                // A confident match: offer to follow that show, so a one-off visit can become a returning reader.
                const top = state.matches[0];
                const page = top && top.similarity >= CONFIDENT ? state.mapped[String(top.anilistId)] : undefined;
                if (!page) return null;
                return (
                  <li>
                    {page.status === "current" && page.id
                      ? <LeadForm compact kind="alert" source="scene-alert" animeId={page.id} animeTitle={page.title} title={`🔔 Email me when the next ${page.title} episode is out`} button="Notify me" />
                      : <LeadForm compact kind="digest" source="scene-digest" title="📰 New episodes and premieres, every Friday" button="Subscribe" />}
                  </li>
                );
              })()}
              {state.hiddenAdult > 0 && <li className="text-xs text-muted">{state.hiddenAdult} adult-only result{state.hiddenAdult === 1 ? " was" : "s were"} hidden.</li>}
            </ol>
          ) : (
            <div className="card p-5 text-sm text-muted"><p className="font-semibold text-ink">No match found.</p><MatchTips /></div>
          )
        )}
      </div>
    </div>
  );
}

/** What to try when a screenshot doesn't match: the usual reasons, most common first. */
function MatchTips() {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted">
      <li>Use the whole frame. Crops, zoomed clips and mirrored videos rarely match.</li>
      <li>Pick a moment without big subtitles, logos or a phone&apos;s on-screen buttons over the picture.</li>
      <li>A photo of a screen works best when you crop it to just the picture and hold the phone straight.</li>
      <li>Try a frame a second before or after: still scenes and fast motion both match less often.</li>
      <li>Fan art and edits are not in the index. For those, try <a href="https://saucenao.com" target="_blank" rel="noopener nofollow" className="underline">SauceNAO</a>.</li>
      <li>Episodes from the last few days may not be indexed yet.</li>
    </ul>
  );
}

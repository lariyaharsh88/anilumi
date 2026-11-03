"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import Image from "next/image";
import Backdrop from "./Backdrop";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

export type Spot = { id: string; href: string; title: string; poster: string | null; cover: string | null; rating: number | null; meta: string; rank: number };

const AUTO_MS = 7000;
const PETALS = [
  { left: "8%", dur: "15s", delay: "0s", drift: "80px" },
  { left: "22%", dur: "19s", delay: "4s", drift: "40px" },
  { left: "41%", dur: "17s", delay: "8s", drift: "70px" },
  { left: "63%", dur: "21s", delay: "2s", drift: "-30px" },
  { left: "78%", dur: "16s", delay: "11s", drift: "50px" },
  { left: "91%", dur: "20s", delay: "6s", drift: "-60px" },
];

/**
 * Home hero: the server-rendered pitch (children) on the left, a rotating spotlight of trending
 * titles on the right, and a backdrop that crossfades to the current title's art. The spotlight is a
 * native scroll-snap strip: the current poster in full in the middle, half of the previous and next
 * ones peeking at the sides (scaled and dimmed by their distance from the centre), arrows on either
 * side, and ordinary swipe/trackpad scrolling. The first slide renders without animation so it
 * counts as normal LCP content. Auto-advance starts only after the
 * visitor's first scroll, tap, click or key press (the inputs that finalise Largest Contentful Paint),
 * so a slide change can never register as a late LCP; it stops on hover, focus, a hidden tab, or
 * "reduce motion".
 */
export default function HeroSpotlight({ items, children }: { items: Spot[]; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [armed, setArmed] = useState(false);
  const n = items.length;
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  /** Scale and dim each slide by its distance from the centre, and report the centred one. */
  const measure = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0, bestD = Infinity;
    Array.from(t.children).forEach((el, k) => {
      const c = el as HTMLElement;
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) / (c.offsetWidth || 1);
      if (d < bestD) { bestD = d; best = k; }
      const x = Math.min(d, 1);
      c.style.setProperty("--s", String(1 - 0.16 * x));
      c.style.setProperty("--o", String(1 - 0.5 * x));
    });
    setI(best);
  }, []);

  const scrollTo = useCallback((k: number) => {
    const t = track.current;
    const c = t?.children[k] as HTMLElement | undefined;
    if (!t || !c) return;
    t.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - t.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);
  const go = useCallback((d: number) => scrollTo((i + d + n) % n), [i, n, scrollTo]);

  useEffect(() => {
    const t = track.current;
    measure();
    window.addEventListener("resize", measure);
    // scrollend settles the caption even where animation frames are throttled (background tabs, low-power mode).
    t?.addEventListener("scrollend", measure);
    return () => { window.removeEventListener("resize", measure); t?.removeEventListener("scrollend", measure); cancelAnimationFrame(frame.current); };
  }, [measure]);
  const onScroll = () => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(measure); };

  useEffect(() => {
    const arm = () => setArmed(true);
    const evs = ["scroll", "wheel", "pointerdown", "keydown", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, arm, { once: true, passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, arm));
  }, []);

  useEffect(() => {
    if (!armed || reduce || paused || n < 2) return;
    const t = setTimeout(() => { if (!document.hidden) go(1); }, AUTO_MS);
    return () => clearTimeout(t);
  }, [i, paused, reduce, n, go, armed]);

  const cur = items[i];
  const art = cur?.cover || cur?.poster;

  return (
    <section
      className="grain relative isolate overflow-hidden rounded-3xl border border-white/10 bg-bg-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,.9)]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Trending spotlight"
    >
      {/* Backdrop: current title's art, crossfading */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <AnimatePresence initial={false}>
          {art && (
            <m.div key={cur.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}>
              <Backdrop src={art} className="opacity-[.38] blur-[1px]" />
            </m.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 veil-spot" />
        <div className="aurora"><span /></div>
        <div className="stars" />
        {PETALS.map((p) => <span key={p.left} className="petal" style={{ left: p.left, ["--dur" as string]: p.dur, ["--delay" as string]: p.delay, ["--drift" as string]: p.drift }} />)}
      </div>

      <div className="relative grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-6 lg:p-12">
        <div className="min-w-0">{children}</div>

        {cur && (
          <div className="relative mx-auto flex w-full min-w-0 max-w-md flex-col items-center">
            {/* Poster strip: centre poster in full, neighbours half visible at the sides */}
            <div className="relative w-full min-w-0">
              <div
                ref={track}
                onScroll={onScroll}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[calc(50%-80px)] py-3 [scrollbar-width:none] sm:gap-4 sm:px-[calc(50%-125px)] [&::-webkit-scrollbar]:hidden"
                aria-label="Trending titles"
              >
                {items.map((s, k) => {
                  const on = k === i;
                  return (
                    <div
                      key={s.id}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${k + 1} of ${n}`}
                      className="relative h-[228px] w-[160px] shrink-0 snap-center sm:h-[360px] sm:w-[250px]"
                      style={{ transform: "scale(var(--s, 1))", opacity: "var(--o, 1)", transition: "transform .15s ease-out, opacity .15s ease-out" }}
                    >
                      <Link
                        href={s.href}
                        tabIndex={on ? 0 : -1}
                        onClick={(e) => { if (!on) { e.preventDefault(); scrollTo(k); } }}
                        className={`group relative block h-full w-full overflow-hidden rounded-2xl border bg-card ${on ? "border-white/15 shadow-[0_25px_60px_-20px_rgba(255,77,109,.45)]" : "border-white/10"}`}
                        aria-label={`${s.title}, trending number ${s.rank}`}
                      >
                        {s.poster ? (
                          <Image src={s.poster} alt="" fill sizes="(max-width: 640px) 160px, 250px" className="object-cover transition duration-500 group-hover:scale-105" priority={k === 0} loading={k === 0 ? undefined : Math.abs(k - i) <= 1 ? "eager" : "lazy"} />
                        ) : <div className="grid h-full place-items-center text-sm text-muted">No image</div>}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
                        {!on && <div className="absolute inset-0 bg-bg/35" aria-hidden />}
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-[#ffc857] backdrop-blur">#{s.rank}<span className="hidden sm:inline"> trending</span></span>
                        {s.rating && <span className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-snow backdrop-blur">★ {(s.rating / 10).toFixed(1)}</span>}
                      </Link>
                    </div>
                  );
                })}
              </div>
              {n > 1 && (
                <>
                  <Arrow dir={-1} onClick={() => go(-1)} />
                  <Arrow dir={1} onClick={() => go(1)} />
                </>
              )}
            </div>

            {/* Caption */}
            <div className="mt-5 w-full max-w-[320px] text-center" aria-live="polite">
              <AnimatePresence initial={false} mode="wait">
                <m.div key={cur.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Link href={cur.href} className="line-clamp-2 text-lg font-bold leading-snug text-ink hover:text-violet-2">{cur.title}</Link>
                  <p className="mt-0.5 text-xs text-muted">{cur.meta}</p>
                </m.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            {n > 1 && (
              <div className="mt-4 flex items-center">
                {items.map((s, k) => (
                  <button key={s.id} type="button" onClick={() => scrollTo(k)} aria-label={`Show ${s.title}`} aria-current={k === i} className="grid h-6 min-w-6 place-items-center">
                    <span className="relative block h-1.5 overflow-hidden rounded-full bg-white/15 transition-[width] duration-300" style={{ width: k === i ? 28 : 8 }}>
                      {k === i && armed && !reduce && !paused && <m.span key={`p${i}`} className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-violet" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTO_MS / 1000, ease: "linear" }} />}
                      {k === i && (!armed || reduce || paused) && <span className="absolute inset-0 bg-gradient-to-r from-accent to-violet" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Round arrow over the side of the poster strip. */
function Arrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Previous title" : "Next title"}
      className={`absolute top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-snow shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-violet ${dir < 0 ? "left-0 sm:left-1" : "right-0 sm:right-1"}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d={dir < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

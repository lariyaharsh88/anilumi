"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
 * titles on the right, and a backdrop that crossfades to the current title's art. The first slide
 * renders without animation so it counts as normal LCP content. Auto-advance starts only after the
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
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

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
  const back = (k: number) => items[(i + k + n) % n];

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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b0d13_0%,rgba(11,13,19,.82)_45%,rgba(11,13,19,.35)_100%)]" />
        <div className="aurora"><span /></div>
        <div className="stars" />
        {PETALS.map((p) => <span key={p.left} className="petal" style={{ left: p.left, ["--dur" as string]: p.dur, ["--delay" as string]: p.delay, ["--drift" as string]: p.drift }} />)}
      </div>

      <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-6 lg:p-12">
        <div className="min-w-0">{children}</div>

        {cur && (
          <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
            {/* Fanned poster stack */}
            <div className="relative h-[228px] w-[160px] sm:h-[360px] sm:w-[250px]" style={{ perspective: 1200 }}>
              {n > 2 && <Ghost spot={back(-1)} rotate={-10} x={-58} />}
              {n > 1 && <Ghost spot={back(1)} rotate={10} x={58} />}
              <AnimatePresence initial={false} mode="popLayout">
                <m.div
                  key={cur.id}
                  className="absolute inset-0 z-10"
                  initial={{ opacity: 0, x: 60, rotate: 6, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, rotate: -6, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                >
                  <Link href={cur.href} className="float-slow group relative block h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-card shadow-[0_25px_60px_-20px_rgba(255,77,109,.45)]" aria-label={`${cur.title}, trending number ${cur.rank}`}>
                    {cur.poster ? (
                      <Image src={cur.poster} alt="" fill sizes="(max-width: 640px) 160px, 250px" className="object-cover transition duration-500 group-hover:scale-105" priority={i === 0} />
                    ) : <div className="grid h-full place-items-center text-sm text-muted">No image</div>}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-gold backdrop-blur">#{cur.rank}<span className="hidden sm:inline"> trending</span></span>
                    {cur.rating && <span className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-ink backdrop-blur">★ {(cur.rating / 10).toFixed(1)}</span>}
                  </Link>
                </m.div>
              </AnimatePresence>
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

            {/* Controls */}
            {n > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={() => go(-1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-ink transition hover:bg-white/10" aria-label="Previous title">‹</button>
                <div className="flex items-center">
                  {items.map((s, k) => (
                    <button key={s.id} type="button" onClick={() => setI(k)} aria-label={`Show ${s.title}`} aria-current={k === i} className="grid h-6 min-w-6 place-items-center">
                      <span className="relative block h-1.5 overflow-hidden rounded-full bg-white/15 transition-[width] duration-300" style={{ width: k === i ? 28 : 8 }}>
                        {k === i && armed && !reduce && !paused && <m.span key={`p${i}`} className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-violet" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTO_MS / 1000, ease: "linear" }} />}
                        {k === i && (!armed || reduce || paused) && <span className="absolute inset-0 bg-gradient-to-r from-accent to-violet" />}
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => go(1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-ink transition hover:bg-white/10" aria-label="Next title">›</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Ghost({ spot, rotate, x }: { spot: Spot; rotate: number; x: number }) {
  return (
    <m.div aria-hidden className="absolute inset-0 hidden overflow-hidden rounded-2xl border border-white/10 bg-card opacity-45 lg:block" initial={false} animate={{ rotate, x, scale: 0.86 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}>
      {spot.poster && <Image key={spot.id} src={spot.poster} alt="" fill sizes="220px" className="object-cover" />}
      <div className="absolute inset-0 bg-bg/40" />
    </m.div>
  );
}

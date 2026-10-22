"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontal card rail.
 * - Touch: native swipe with snap; edge-to-edge on phones so the next card peeks in.
 * - Mouse: drag to scroll with a little momentum (a drag never opens a card), arrow buttons, wheel/trackpad.
 * - Edges fade only where there's more content; a slim progress bar shows position.
 * - overscroll-behavior contains sideways gestures, so the page never scrolls or navigates back.
 */
export default function RailScroller({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ atStart: true, atEnd: false, ratio: 1, progress: 0 });
  const drag = useRef({ active: false, moved: false, x: 0, left: 0, lastX: 0, lastT: 0, v: 0 });
  const frame = useRef(0);

  const sync = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      setState({
        atStart: el.scrollLeft < 8,
        atEnd: el.scrollLeft >= max - 8,
        ratio: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
        progress: max > 0 ? el.scrollLeft / max : 0,
      });
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", sync); ro.disconnect(); cancelAnimationFrame(frame.current); };
  }, [sync]);

  const page = (d: number) => {
    const el = ref.current;
    if (!el) return;
    // Land on a card edge: find the first card that starts beyond the visible page.
    const cards = [...el.children] as HTMLElement[];
    const target = el.scrollLeft + d * el.clientWidth * 0.9;
    const snap = cards.map((c) => c.offsetLeft - el.offsetLeft).reduce((best, x) => (Math.abs(x - target) < Math.abs(best - target) ? x : best), target);
    el.scrollTo({ left: snap - 16, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
    drag.current = { active: true, moved: false, x: e.clientX, left: ref.current.scrollLeft, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current, el = ref.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) { d.moved = true; el.classList.add("is-dragging"); el.setPointerCapture(e.pointerId); }
    if (!d.moved) return;
    el.scrollLeft = d.left - dx;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX; d.lastT = e.timeStamp;
  };
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current, el = ref.current;
    if (!d.active || !el) return;
    d.active = false;
    if (d.moved) {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.scrollBy({ left: -d.v * 220, behavior: "smooth" }); // momentum
      setTimeout(() => el.classList.remove("is-dragging"), 260);
    }
  };

  const fade = (on: boolean, w: string) => (on ? "#000" : "transparent") + " 0, #000 " + (on ? "0" : w);
  const mask = state.atStart && state.atEnd ? undefined : `linear-gradient(90deg, ${fade(state.atStart, "36px")}, #000 calc(100% - ${state.atEnd ? "0px" : "56px"}), ${state.atEnd ? "#000" : "transparent"} 100%)`;
  const scrollable = state.ratio < 0.999;
  const btn = "rail-btn absolute top-[40%] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-bg/85 text-xl text-ink shadow-[0_10px_30px_-10px_rgba(0,0,0,.9)] backdrop-blur transition duration-200 hover:scale-110 hover:border-violet hover:bg-card focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="group/rail relative -mx-4 sm:mx-0" role="region" aria-label={label}>
      <button type="button" onClick={() => page(-1)} disabled={state.atStart} className={`${btn} left-1 opacity-75 group-hover/rail:opacity-100 sm:-left-4`} aria-label={`Scroll ${label} left`}>‹</button>
      <div
        ref={ref}
        className="scroll-x cursor-grab px-4 pt-2 sm:px-0"
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } }}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>
      <button type="button" onClick={() => page(1)} disabled={state.atEnd} className={`${btn} right-1 opacity-75 group-hover/rail:opacity-100 sm:-right-4`} aria-label={`Scroll ${label} right`}>›</button>
      {scrollable && (
        <div className="mx-4 mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.07] sm:mx-0" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-violet transition-[width] duration-200"
            style={{ width: `${Math.max(8, state.ratio * 100)}%`, transform: `translateX(${state.progress * (100 / Math.max(0.08, state.ratio) - 100)}%)` }}
          />
        </div>
      )}
    </div>
  );
}

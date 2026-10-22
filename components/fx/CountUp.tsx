"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Counts the leading number in `text` up from zero when it scrolls into view. Server HTML and
 * anything already on screen at load show the final value, so nothing flashes and crawlers see real numbers.
 */
export default function CountUp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);
  const armed = useRef(false);
  const m = text.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);

  useEffect(() => {
    if (!m || reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already visible: leave the real value
    armed.current = true;
    setOut(`${m[1]}0${m[3]}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!inView || !armed.current || !m) return;
    const target = Number(m[2].replace(/,/g, ""));
    const dec = (m[2].split(".")[1] || "").length;
    const commas = m[2].includes(",");
    const c = animate(0, target, {
      duration: 1.1,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => setOut(`${m[1]}${commas ? Math.round(v).toLocaleString("en-US") : v.toFixed(dec)}${m[3]}`),
      onComplete: () => setOut(text),
    });
    return () => c.stop();
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span ref={ref}>{out}</span>;
}

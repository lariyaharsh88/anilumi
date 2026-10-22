"use client";
import { useEffect, useRef, useState } from "react";
import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/**
 * 3D tilt with a soft light glare that follows the pointer. Fine pointers only; touch, keyboard
 * and "reduce motion" get a plain card. Children render identically on the server.
 */
export default function TiltCard({ children, className = "", max = 9 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 260, damping: 22 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 260, damping: 22 });
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(220px circle at ${gx} ${gy}, rgba(255,255,255,.22), transparent 60%)`;

  useEffect(() => { setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches); }, []);
  const on = fine && !reduce;

  return (
    <div className="[perspective:900px]">
      <m.div
        ref={ref}
        className={`relative [transform-style:preserve-3d] ${className}`}
        style={on ? { rotateX: rx, rotateY: ry } : undefined}
        whileHover={on ? { scale: 1.035, y: -4 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onPointerMove={on ? (e) => {
          const r = ref.current!.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        } : undefined}
        onPointerLeave={on ? () => { px.set(0.5); py.set(0.5); } : undefined}
      >
        {children}
        {on && <m.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />}
      </m.div>
    </div>
  );
}

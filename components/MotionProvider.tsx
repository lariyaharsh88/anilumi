"use client";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/** Loads only the DOM animation feature set (smaller bundle) and honours "reduce motion" site-wide. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

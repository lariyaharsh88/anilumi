"use client";
import { OPEN_EVENT } from "@/lib/consent";

/** Footer "Cookie choices": reopens the analytics consent banner (components/Analytics.tsx). */
export default function ConsentLink({ className = "" }: { className?: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className={className}>Cookie choices</button>;
}

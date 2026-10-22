"use client";
import { useEffect, useState } from "react";

/** Renders the viewer's local time for a JST timestamp after hydration; server output stays JST-only. */
export default function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Tokyo") return;
    setText(d.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }) + " your time");
  }, [iso]);
  if (!text) return null;
  return <span className="text-muted"> · {text}</span>;
}

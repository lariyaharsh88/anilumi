"use client";
import { useEffect, useState } from "react";

/** Google / Apple-Outlook subscribe links and a plain .ics download for a set of Kitsu ids. */
export default function CalendarLinks({ ids, compact = false }: { ids: string[]; compact?: boolean }) {
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  if (!ids.length) return null;
  const path = `/api/calendar?ids=${ids.join(",")}`;
  const https = `${origin ?? ""}${path}`;
  const webcal = https.replace(/^https?:\/\//, "webcal://");
  const google = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;
  const local = origin ? /\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin) : false;
  const cls = compact ? "text-violet hover:underline" : "btn-outline";
  return (
    <div className={compact ? "text-sm" : "mt-3"}>
      <div className={compact ? "flex flex-wrap items-center gap-x-3 gap-y-1" : "flex flex-wrap gap-2"}>
        {compact && <span className="text-muted">Add to calendar:</span>}
        <a href={origin ? google : "#"} target="_blank" rel="noopener" className={cls}>Google Calendar</a>
        <a href={origin ? webcal : "#"} className={cls}>Apple / Outlook</a>
        <a href={path} download className={cls}>Download .ics</a>
      </div>
      {local && <p className="mt-2 text-xs text-muted">Google can only subscribe once the site is on a public address; the .ics download works now.</p>}
    </div>
  );
}

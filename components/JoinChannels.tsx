"use client";
import { site } from "@/lib/site";
import { track } from "@/lib/track";

/**
 * "Follow for new dubs" next to the Indian dub lists: one tap to the WhatsApp or Telegram channel (lib/site.ts),
 * no sign-up, unlike the email alert beside it. Clicks go to GA4
 * as `channel_join` with the channel and the CTA, the same way lead forms report their `source`.
 */
export default function JoinChannels({ source, lang = "Hindi", compact = false, className = "" }: { source: string; lang?: string; compact?: boolean; className?: string }) {
  const channels = site.channels;
  const link = (c: (typeof channels)[number], cls: string) => (
    <a key={c.name} href={c.url} target="_blank" rel="noopener nofollow" className={cls} onClick={() => track("channel_join", { channel: c.name.toLowerCase(), source })}>
      {c.name === "WhatsApp" ? "💬" : "✈️"} {c.name}
    </a>
  );

  if (compact) {
    return (
      <p className={`text-xs text-muted ${className}`}>
        🔔 New {lang} dubs the day they&rsquo;re added: {channels.map((c, i) => <span key={c.name}>{i ? " · " : ""}{link(c, "font-medium text-violet hover:underline")}</span>)}
      </p>
    );
  }
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/[.06] p-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <p className="font-semibold text-ink">🔔 Get new {lang} dubs on WhatsApp or Telegram</p>
        <p className="mt-0.5 text-sm text-muted">One tap, no sign-up. A post when an official dub is added, plus what&rsquo;s free this week.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {channels.map((c) => link(c, c.name === "WhatsApp" ? "btn-primary" : "btn-outline"))}
      </div>
    </div>
  );
}

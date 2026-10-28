"use client";
import { useEffect, useState } from "react";
import Link from "@/components/Link";
import { send } from "@/lib/community-client";
import { track } from "@/lib/track";
import type { LeadKind } from "@/lib/community";

type Props = {
  kind: LeadKind;
  /** Which CTA this is, for GA4 and the admin breakdown (e.g. "anime-alert"). */
  source: string;
  title: string;
  blurb?: string;
  button?: string;
  animeId?: string;
  animeTitle?: string;
  /** Shown after signing up (e.g. a link to the cheat sheet). */
  done?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

const utm = () => {
  try { const q = new URLSearchParams(location.search); return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign"].map((k) => [k, q.get(k) || ""])); } catch { return {}; }
};

/** Email signup used by every lead CTA. Only rendered when the database is configured (the server decides). */
export default function LeadForm({ kind, source, title, blurb, button = "Notify me", animeId, animeTitle, done, compact = false, className = "" }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [err, setErr] = useState("");
  // Until hydrated, a submit would do a plain page reload; keep the button off until the handler is attached.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const id = `lead-${source}`;

  if (state === "ok")
    return (
      <div className={`${compact ? "" : "card p-4"} ${className}`} role="status">
        <p className="font-semibold text-ink">✓ You&apos;re on the list.</p>
        {done || <p className="mt-1 text-sm text-muted">We&apos;ll only email you about what you signed up for, and every email has a one-click unsubscribe.</p>}
      </div>
    );

  return (
    <form
      className={`${compact ? "" : "card p-4"} ${className}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!consent) return setErr("Please tick the box to agree to the emails.");
        setState("busy"); setErr("");
        const hp = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value || "";
        const res = await send("/api/lead", { email, kind, source, animeId, animeTitle, consent, website: hp, page: location.pathname, utm: utm() });
        if (res.error) { setState("idle"); return setErr(res.error); }
        setState("ok");
        track("generate_lead", { source, kind, anime_id: animeId });
      }}
    >
      <p className={`font-semibold text-ink ${compact ? "text-sm" : ""}`}>{title}</p>
      {blurb && <p className="mt-1 text-sm text-muted">{blurb}</p>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">Email address</label>
        <input id={id} type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input min-w-0 flex-1" />
        <button type="submit" disabled={!ready || state === "busy"} className="btn-primary shrink-0">{state === "busy" ? "Saving…" : button}</button>
      </div>
      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <label className="mt-2 flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#8b7cff]" />
        <span>Email me about this from AniLumi. Unsubscribe any time. <Link href="/privacy" className="underline hover:text-ink">Privacy</Link></span>
      </label>
      {err && <p className="mt-2 text-xs text-accent-2" role="alert">{err}</p>}
    </form>
  );
}

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
  /** Runs before sending; its fields join the request, or its error is shown (list alerts turn sync on here). */
  prepare?: () => Promise<Record<string, unknown> | { error: string }>;
  /** The form's own wording (title, blurb and button come from the caller). */
  lang?: "en" | "hi";
};

const T = {
  en: {
    inbox: "📬 Check your inbox to confirm.", listed: "✓ You're on the list.",
    tap: "Tap the link in the email we just sent. Not there in a minute? Look in Promotions or Spam, and mark it \"Not spam\" so the alerts reach your inbox. ",
    gmail: "Open Gmail", only: "We'll only email you about what you signed up for, and every email has a one-click unsubscribe.",
    agree: "Please tick the box to agree to the emails.", saving: "Saving…", consent: "Email me about this from AniLumi. Unsubscribe any time.", privacy: "Privacy", label: "Email address",
  },
  hi: {
    inbox: "📬 पुष्टि के लिए अपना ईमेल देखें।", listed: "✓ आप लिस्ट में जुड़ गए हैं।",
    tap: "हमने अभी जो ईमेल भेजा है, उसमें लिंक पर टैप करें। एक मिनट में न दिखे तो Promotions या Spam देखें, और \"Not spam\" चुनें ताकि अलर्ट इनबॉक्स में आएं। ",
    gmail: "Gmail खोलें", only: "हम सिर्फ़ उसी के बारे में ईमेल भेजेंगे जिसके लिए आपने साइन अप किया है। हर ईमेल में एक क्लिक में अनसब्सक्राइब का लिंक होता है।",
    agree: "ईमेल पाने के लिए बॉक्स पर टिक करें।", saving: "सेव हो रहा है…", consent: "AniLumi से इसके बारे में ईमेल भेजें। कभी भी अनसब्सक्राइब करें।", privacy: "प्राइवेसी", label: "ईमेल पता",
  },
};

/** Gmail's search for the confirmation email, Promotions and Spam included. */
const GMAIL = "https://mail.google.com/mail/u/0/#search/from%3Aanilumi.in+in%3Aanywhere";
const isGmail = (email: string) => /@(gmail|googlemail)\.com$/i.test(email.trim());

const utm = () => {
  try { const q = new URLSearchParams(location.search); return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign"].map((k) => [k, q.get(k) || ""])); } catch { return {}; }
};

/** Email signup used by every lead CTA. Only rendered when the database is configured (the server decides). */
export default function LeadForm({ kind, source, title, blurb, button = "Notify me", animeId, animeTitle, done, compact = false, className = "", prepare, lang = "en" }: Props) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  // Until hydrated, a submit would do a plain page reload; keep the button off until the handler is attached.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const id = `lead-${source}`;

  if (state === "ok")
    return (
      <div className={`${compact ? "" : "card p-4"} ${className}`} role="status">
        <p className="font-semibold text-ink">{confirm ? t.inbox : t.listed}</p>
        {done}
        <p className="mt-1 text-sm text-muted">{confirm ? t.tap : ""}{t.only}</p>
        {confirm && isGmail(email) && (
          <a href={GMAIL} target="_blank" rel="noopener nofollow" onClick={() => track("lead_open_gmail", { source })} className="btn-outline mt-3 inline-flex">✉ {t.gmail}</a>
        )}
      </div>
    );

  return (
    <form
      className={`${compact ? "" : "card p-4"} ${className}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!consent) return setErr(t.agree);
        setState("busy"); setErr("");
        const hp = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value || "";
        const extra = prepare ? await prepare() : {};
        if ("error" in extra && typeof extra.error === "string") { setState("idle"); return setErr(extra.error); }
        const res = await send<{ ok: boolean; confirm?: boolean }>("/api/lead", { ...extra, email, kind, source, animeId, animeTitle, consent, website: hp, page: location.pathname, utm: utm() });
        if (res.error) { setState("idle"); return setErr(res.error); }
        setConfirm(Boolean(res.confirm));
        setState("ok");
        track("generate_lead", { source, kind, anime_id: animeId });
      }}
    >
      <p className={`font-semibold text-ink ${compact ? "text-sm" : ""}`}>{title}</p>
      {blurb && <p className="mt-1 text-sm text-muted">{blurb}</p>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">{t.label}</label>
        <input id={id} type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input min-w-0 flex-1" />
        <button type="submit" disabled={!ready || state === "busy"} className="btn-primary shrink-0">{state === "busy" ? t.saving : button}</button>
      </div>
      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <label className="mt-2 flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#8b7cff]" />
        <span>{t.consent} <Link href="/privacy" className="underline hover:text-ink">{t.privacy}</Link></span>
      </label>
      {err && <p className="mt-2 text-xs text-accent-2" role="alert">{err}</p>}
    </form>
  );
}

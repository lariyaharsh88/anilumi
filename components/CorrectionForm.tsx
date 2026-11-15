"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { send } from "@/lib/community-client";
import { track } from "@/lib/track";

/** Opens the dub report form (kind "dub") pre-filled with "<title> (<language> dub)": sent by the dub list cards. */
export const reportDub = (what: string) => window.dispatchEvent(new CustomEvent("dub-report", { detail: what }));

type Props = {
  /** "correction": a collapsed "Spotted a mistake?" link for any page; "contact": the open form on /contact;
   *  "dub": the Hindi/Tamil/Telugu lists' "Report a change" form, opened from any card (reportDub). */
  kind?: "correction" | "contact" | "dub";
  className?: string;
};

/** Report a mistake on the current page, or send a message. Only rendered when the database is configured. */
export default function CorrectionForm({ kind = "correction", className = "" }: Props) {
  const page = usePathname() || "/";
  const [open, setOpen] = useState(kind === "contact");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const id = `fix-${kind}`;
  useEffect(() => { if (kind === "correction") { setOpen(false); setState("idle"); setMessage(""); } }, [page, kind]);
  useEffect(() => {
    if (kind !== "dub") return;
    const on = (e: Event) => {
      setOpen(true); setState("idle"); setMessage(`${(e as CustomEvent<string>).detail}: `);
      requestAnimationFrame(() => { const el = document.getElementById(`${id}-msg`) as HTMLTextAreaElement | null; el?.scrollIntoView({ block: "center", behavior: "smooth" }); el?.focus(); });
    };
    window.addEventListener("dub-report", on);
    return () => window.removeEventListener("dub-report", on);
  }, [kind, id]);

  if (state === "ok")
    return <p className={`text-sm text-ink ${className}`} role="status">✓ Thanks! We read every report and fix confirmed mistakes.</p>;

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={`text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-ink ${className}`}>
        {kind === "dub" ? "A dub moved, started or ended? Report a change" : "Spotted a mistake on this page? Tell us"}
      </button>
    );

  return (
    <form
      className={`card max-w-xl p-4 ${className}`}
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy"); setErr("");
        const hp = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value || "";
        const res = await send("/api/correction", { message, email, kind, page, website: hp });
        // Server-side failures (no database, outage, blocked origin) get one plain message; validation errors pass through.
        if (res.error) { setState("idle"); return setErr(/^(Not available|Temporarily unavailable|Forbidden|Too large)$/.test(res.error) ? "The form can't be sent right now. Please try again in a few minutes." : res.error); }
        setState("ok");
        track("report_mistake", { kind, page });
      }}
    >
      <label htmlFor={`${id}-msg`} className="font-semibold text-ink">{kind === "contact" ? "Your message" : kind === "dub" ? "What changed? A link to the platform or announcement helps" : "What's wrong on this page?"}</label>
      <textarea id={`${id}-msg`} required minLength={10} maxLength={1500} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={kind === "contact" ? "Questions, ideas or corrections…" : kind === "dub" ? "e.g. Season 2 is now on Crunchyroll in Tamil too: https://…" : "e.g. Episode 12 is canon, not filler (source: the manga, chapter 98)"} className="input mt-2 w-full" />
      <label htmlFor={`${id}-email`} className="mt-3 block text-sm text-muted">Email, if you&apos;d like a reply (optional)</label>
      <input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input mt-1 w-full" />
      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={!ready || state === "busy"} className="btn-primary">{state === "busy" ? "Sending…" : "Send"}</button>
        {kind !== "contact" && <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-ink">Cancel</button>}
      </div>
      {err && <p className="mt-2 text-xs text-accent-2" role="alert">{err}</p>}
    </form>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "@/components/Link";
import { send } from "@/lib/community-client";
import { track } from "@/lib/track";

const TYPES = ["Sponsorship / ads", "Affiliate partnership", "Merch or product placement", "Streaming / app promotion", "Other"];
const BUDGETS = ["Under $500", "$500–2,000", "$2,000–10,000", "$10,000+", "Not sure yet"];

/** Business enquiry form on /advertise. */
export default function PartnerForm() {
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (state === "ok")
    return <div className="card p-5" role="status"><p className="text-lg font-semibold text-ink">✓ Thanks, we&apos;ve got it.</p><p className="mt-1 text-sm text-muted">We reply to every enquiry, usually within two working days.</p></div>;
  return (
    <form
      className="card relative grid gap-4 p-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = (k: string) => String(f.get(k) || "");
        if (!f.get("consent")) return setErr("Please tick the box so we can reply to you.");
        setState("busy"); setErr("");
        const res = await send("/api/partner", { name: v("name"), email: v("email"), company: v("company"), site: v("site"), type: v("type"), budget: v("budget"), message: v("message"), consent: true, website: v("website") });
        if (res.error) { setState("idle"); return setErr(res.error); }
        setState("ok");
        track("generate_lead", { source: "advertise", kind: "partner" });
      }}
    >
      <label className="text-sm"><span className="mb-1 block text-muted">Your name *</span><input name="name" required maxLength={120} autoComplete="name" className="input" /></label>
      <label className="text-sm"><span className="mb-1 block text-muted">Work email *</span><input name="email" type="email" required autoComplete="email" className="input" /></label>
      <label className="text-sm"><span className="mb-1 block text-muted">Company or brand</span><input name="company" maxLength={160} autoComplete="organization" className="input" /></label>
      <label className="text-sm"><span className="mb-1 block text-muted">Website</span><input name="site" maxLength={300} inputMode="url" placeholder="https://" className="input" /></label>
      <label className="text-sm"><span className="mb-1 block text-muted">What are you interested in?</span><select name="type" className="input" defaultValue=""><option value="">Choose one</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="text-sm"><span className="mb-1 block text-muted">Budget</span><select name="budget" className="input" defaultValue=""><option value="">Choose one</option>{BUDGETS.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="text-sm sm:col-span-2"><span className="mb-1 block text-muted">Tell us about your campaign *</span><textarea name="message" required minLength={10} maxLength={3000} rows={5} className="input" /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <label className="flex items-start gap-2 text-xs text-muted sm:col-span-2">
        <input type="checkbox" name="consent" className="mt-0.5 accent-[#8b7cff]" />
        <span>AniLumi may contact me about this enquiry. <Link href="/privacy" className="underline hover:text-ink">Privacy</Link></span>
      </label>
      {err && <p className="text-sm text-accent-2 sm:col-span-2" role="alert">{err}</p>}
      <div className="sm:col-span-2"><button type="submit" disabled={!ready || state === "busy"} className="btn-primary">{state === "busy" ? "Sending…" : "Send enquiry"}</button></div>
    </form>
  );
}

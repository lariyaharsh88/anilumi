"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "@/components/Link";
import { isAutomated, mustAsk, OPEN_EVENT, readChoice, saveChoice, withdraw, type Choice } from "@/lib/consent";
import { aiSource } from "@/lib/aireferral";
import { track } from "@/lib/track";

/**
 * Plausible (NEXT_PUBLIC_PLAUSIBLE_DOMAIN, cookieless, always on), GA4 (NEXT_PUBLIC_GA_ID) and Microsoft Clarity
 * (NEXT_PUBLIC_CLARITY_ID). GA and Clarity wait for consent where the law asks for it (EEA, UK, Switzerland:
 * lib/consent.ts) and load straight away elsewhere; anyone can refuse from "Cookie choices" in the footer.
 * Clarity loads when the browser is idle, so it never competes with the page's main image. Neither loads for
 * crawlers or automated browsers (isAutomated), which would otherwise show up as direct visits.
 */
export default function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;
  const [allowed, setAllowed] = useState(false);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if ((!ga && !clarity) || isAutomated()) return;
    let live = true;
    const choice = readChoice();
    if (choice === "granted") setAllowed(true);
    else if (choice !== "denied") mustAsk().then((must) => { if (!live) return; if (must) setAsk(true); else setAllowed(true); });
    const open = () => setAsk(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => { live = false; window.removeEventListener(OPEN_EVENT, open); };
  }, [ga, clarity]);

  // Visitors sent by an AI assistant (lib/aireferral.ts), once per visit: a Plausible goal (cookieless, always on)
  // and, once GA is allowed and loaded, a GA4 ai_referral event. Each waits up to ~10 s for its script.
  useEffect(() => sendAiReferral("plausible"), []);
  useEffect(() => (allowed ? sendAiReferral("ga") : undefined), [allowed]);

  // The digest bar waits while the banner is up, so the two never stack.
  useEffect(() => { (window as unknown as { __alConsentAsk?: boolean }).__alConsentAsk = ask; }, [ask]);

  const choose = (v: Choice) => {
    saveChoice(v);
    setAsk(false);
    if (v === "granted") setAllowed(true);
    else { withdraw(); setAllowed(false); }
  };

  return (
    <>
      {plausible && <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />}
      {allowed && ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}</Script>
        </>
      )}
      {allowed && clarity && (
        <Script id="ms-clarity" strategy="lazyOnload">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");window.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});`}</Script>
      )}
      {ask && (
        <div role="dialog" aria-labelledby="consent-h" aria-describedby="consent-d" className="fixed inset-x-3 bottom-3 z-50 sm:left-4 sm:right-auto sm:max-w-md">
          <div className="card border-violet/30 p-4 shadow-2xl sm:p-5" style={{ background: "var(--color-bg-2)" }}>
            <p id="consent-h" className="font-semibold text-ink">🍪 Can we measure your visit?</p>
            <p id="consent-d" className="mt-1 text-sm leading-6 text-ink/80">
              We&apos;d like to use Google Analytics and Microsoft Clarity (cookies and anonymised clicks) to see which pages help and which are hard to use. No ads, nothing sold. <Link href="/privacy" className="text-violet underline-offset-2 hover:underline">Privacy</Link>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => choose("denied")} className="min-h-11 rounded-full border border-line bg-white/[0.06] px-4 text-sm font-semibold text-ink hover:bg-white/10">Reject</button>
              <button type="button" onClick={() => choose("granted")} className="min-h-11 rounded-full border border-violet bg-violet-strong px-4 text-sm font-semibold text-snow hover:opacity-90">Accept</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** One AI-referral event per visit and per tool; returns the effect's cleanup. */
function sendAiReferral(to: "plausible" | "ga"): (() => void) | undefined {
  if (isAutomated()) return;
  let source: string | null = null;
  try {
    source = sessionStorage.getItem("al_ai_ref") ?? aiSource(document.referrer, location.search);
    if (!source || sessionStorage.getItem(`al_ai_ref_${to}`)) return;
    sessionStorage.setItem("al_ai_ref", source);
  } catch { source = aiSource(document.referrer, location.search); }
  if (!source) return;
  const src = source;
  let tries = 0;
  const id = window.setInterval(() => {
    const w = window as unknown as { plausible?: (e: string, o: object) => void; gtag?: unknown };
    const ready = to === "ga" ? Boolean(w.gtag) : Boolean(w.plausible);
    if (!ready && ++tries < 20) return;
    window.clearInterval(id);
    if (!ready) return;
    try {
      if (to === "ga") track("ai_referral", { ai_source: src, landing: location.pathname });
      else w.plausible?.("AI referral", { props: { source: src } });
      sessionStorage.setItem(`al_ai_ref_${to}`, "1");
    } catch { /* analytics must never break the page */ }
  }, 500);
  return () => window.clearInterval(id);
}

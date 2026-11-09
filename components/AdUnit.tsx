"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { mustAsk } from "@/lib/consent";

/**
 * One responsive AdSense unit. Shown only where no consent banner is legally required (outside the EEA, UK and
 * Switzerland): AdSense there needs a Google-certified consent platform, which the site's own banner isn't. The
 * space is reserved before the ad loads, so the page doesn't jump.
 */
export default function AdUnit({ client, slot, className = "" }: { client: string; slot: string; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { mustAsk().then((must) => setShow(!must)).catch(() => {}); }, []);
  useEffect(() => {
    if (!show) return;
    try { ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({}); } catch { /* blocked: leave the space */ }
  }, [show]);
  if (!show) return null;
  return (
    <div className={`my-8 min-h-[100px] ${className}`} aria-label="Advertisement">
      <Script id="adsense" strategy="lazyOnload" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} />
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

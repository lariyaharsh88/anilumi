"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { mustAsk, readChoice } from "@/lib/consent";
import { ONELINK_ID, storeForZone } from "@/lib/affiliate";

/**
 * Amazon OneLink (set up in Associates Central for the US account): sends visitors from other OneLink countries
 * (UK, Canada, Germany…) who click an amazon.com link to their own Amazon store. Loads once per page, only when an
 * instance id is set, never for India-time visitors (they already get amazon.in links), and, as an advertising
 * script, only after "Accept" where consent is required (lib/consent.ts).
 */
export default function OneLink() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!ONELINK_ID) return;
    let tz: string | undefined;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unknown: treat as elsewhere */ }
    if (storeForZone(tz) === "in") return;
    const choice = readChoice();
    if (choice === "granted") setOk(true);
    else if (choice !== "denied") mustAsk().then((must) => setOk(!must)).catch(() => {});
  }, []);
  if (!ok) return null;
  return (
    <>
      <div id={`amzn-assoc-ad-${ONELINK_ID}`} />
      <Script id="amazon-onelink" strategy="lazyOnload" src={`https://z-na.amazon-adsystem.com/widgets/onejs?MarketPlace=US&adInstanceId=${ONELINK_ID}`} />
    </>
  );
}

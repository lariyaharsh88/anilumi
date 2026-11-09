"use client";
import { useEffect, useState, type ReactNode } from "react";
import { amazonSearch, affiliateRel, storeForZone, type Dept, type Store } from "@/lib/affiliate";
import { track } from "@/lib/track";

/**
 * An Amazon books search link for the visitor's own store: amazon.in in India, amazon.com elsewhere. Pages are
 * cached for everyone, so the server renders amazon.com (or `store`) and the browser switches it by time zone.
 */
export default function AmazonLink({ query, store = "us", dept = "books", source, className, children }: { query: string; store?: Store; dept?: Dept; source: string; className?: string; children: ReactNode }) {
  const [s, setS] = useState<Store>(store);
  useEffect(() => {
    try { setS(storeForZone(Intl.DateTimeFormat().resolvedOptions().timeZone)); } catch { /* keep the default */ }
  }, []);
  return (
    <a href={amazonSearch(query, s, dept)} target="_blank" rel={affiliateRel} className={className} onClick={() => track("affiliate_click", { store: s, source, query })}>
      {children}
    </a>
  );
}

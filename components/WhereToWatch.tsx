"use client";
import { useEffect, useState } from "react";
import { streamLink, affiliateRel } from "@/lib/affiliate";
import type { ProviderGroup } from "@/lib/tmdb";

type KitsuLink = { id: string; url: string; site: string; dubs: string[] };
type Resp = { configured: boolean; country: string; match?: { name: string } | null; link?: string | null; groups?: ProviderGroup[]; countries?: string[] };

const COMMON = ["US", "CA", "GB", "IE", "AU", "NZ", "IN", "SG", "PH", "MY", "ID", "TH", "JP", "KR", "DE", "FR", "ES", "IT", "NL", "SE", "PL", "BR", "MX", "AR", "CL", "ZA", "AE", "TR"];
const KEY = "anilumi:country";
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const save = (c: string) => { try { localStorage.setItem(KEY, c); } catch { /* storage blocked */ } };

/**
 * Server renders Kitsu's region-less links (works without JS or a TMDB key). On mount it asks
 * /api/watch for the viewer's country; if TMDB is configured it swaps in that country's providers.
 */
export default function WhereToWatch({ animeId, title, links, extra }: { animeId: string; title: string; links: KitsuLink[]; extra?: React.ReactNode }) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  const load = (country?: string) => {
    setLoading(true);
    fetch(`/api/watch?id=${animeId}${country ? `&country=${country}` : ""}`)
      .then((r) => r.json())
      .then((d: Resp) => { setData(d); if (d.configured && !country) save(d.country); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(read() || undefined); }, [animeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const heading = (text: string) => (
    <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><span aria-hidden className="text-accent-2">▶</span> {text}</h2>
  );
  const kitsuButtons = (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((s, i) => (
        <a key={s.id} href={streamLink(s.url)} target="_blank" rel={affiliateRel} className={`${i ? "btn-outline" : "btn-primary"} px-4 py-2.5 font-semibold capitalize`}>▶ {s.site}{s.dubs.includes("en") ? " (dub)" : ""}</a>
      ))}
      {extra}
    </div>
  );

  if (!data?.configured) {
    return links.length || extra ? (
      <div>
        {heading("Where to watch")}
        {kitsuButtons}
      </div>
    ) : null;
  }

  const names = new Intl.DisplayNames(undefined, { type: "region" });
  const country = data.country;
  const options = [...new Set([country, ...COMMON, ...(data.countries || [])])].sort((x, y) => (names.of(x) || x).localeCompare(names.of(y) || y));
  const deep = (name: string) => links.find((l) => l.site.toLowerCase().replace(/\s+/g, "").includes(name.toLowerCase().split(" ")[0]));
  const groups = data.groups || [];

  return (
    <div className={loading ? "opacity-60" : ""} aria-busy={loading}>
      <div className="flex flex-wrap items-center gap-2">
        {heading("Where to watch in")}
        <select value={country} onChange={(e) => { save(e.target.value); load(e.target.value); }} className="input w-auto py-1 text-xs" aria-label="Country">
          {options.map((c) => <option key={c} value={c}>{names.of(c) || c}</option>)}
        </select>
      </div>
      {groups.length ? (
        <div className="mt-2 space-y-2">
          {groups.map((g) => (
            <div key={g.kind} className="flex flex-wrap items-center gap-2">
              <span className="w-full text-[11px] text-muted sm:w-40">{g.label}</span>
              {g.providers.map((p, i) => {
                const k = deep(p.name);
                const href = k ? streamLink(k.url) : data.link || "#";
                return (
                  <a key={p.id} href={href} target="_blank" rel={affiliateRel} className={`${i || g !== groups[0] ? "btn-outline" : "btn-primary"} gap-2 px-4 py-2.5 font-semibold`} title={`${title} on ${p.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.logo && <img src={p.logo} alt="" width={20} height={20} className="rounded" loading="lazy" />}
                    {p.name}
                  </a>
                );
              })}
            </div>
          ))}
          <p className="text-[11px] text-muted">Availability in {names.of(country)} by JustWatch, via TMDB. Catalogues change; check the service before subscribing.</p>
          {extra && <div className="flex flex-wrap gap-2">{extra}</div>}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-muted">{data.match ? `${title} isn't listed on a streaming service in ${names.of(country)} right now.` : `We couldn't find ${title} in streaming catalogues for ${names.of(country)}.`}{links.length ? " Official links below may be region-locked." : ""}</p>
          {kitsuButtons}
        </div>
      )}
    </div>
  );
}

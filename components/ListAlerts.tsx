"use client";
import { useEffect, useState } from "react";
import LeadForm from "./LeadForm";
import { useSync } from "@/lib/sync";
import { useWatchlist } from "@/lib/watchlist";

/**
 * My list: one email signup for new episodes of every airing show on the list. Alerts follow the synced copy of
 * the list (app/api/sync), so shows added later on any device are included; sync is turned on here if it's off.
 * Rendered only when the database is on (app/my/page.tsx).
 */
export default function ListAlerts({ className = "" }: { className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { saved, start } = useSync(ready);
  const { items, ready: listReady } = useWatchlist();
  if (!ready || !listReady || !items.length) return null;
  const airing = items.filter((i) => i.status === "current" || i.status === "upcoming").length;
  return (
    <LeadForm
      className={className}
      kind="list"
      source="mylist-alerts"
      title="📬 Email me new episodes of my shows"
      blurb={`One email as each new episode of a show on this list airs${airing ? ` (${airing} airing or upcoming now)` : ""}. Shows you add later are included.${saved ? "" : " This turns on sync, so your list is kept on our server under a private code."}`}
      button="Email me"
      prepare={async () => {
        const code = saved?.code ?? (await start());
        return code ? { code } : { error: "Couldn't save your list for alerts. Please try again." };
      }}
    />
  );
}

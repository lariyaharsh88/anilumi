import { listAnime, getLastAiredBest, primeAniList, animePath, episodePath, uniqueById } from "@/lib/kitsu";
import { buildIcs, IcsEvent } from "@/lib/ics";
import { site, abs } from "@/lib/site";

export const revalidate = 1800;

/** Subscribable calendar: next episode of each airing show + premiere date of upcoming ones. ?ids=1,2,3 (max 40). */
export async function GET(req: Request) {
  const ids = [...new Set((new URL(req.url).searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s)))].slice(0, 40);
  if (!ids.length) return new Response("Pass ?ids=<kitsu ids>", { status: 400 });
  const chunks = [0, 20].map((i) => ids.slice(i, i + 20)).filter((c) => c.length);
  const shows = uniqueById((await Promise.all(chunks.map((c) => listAnime({ filter: { id: c.join(",") }, limit: 20, revalidate: 1800 })))).flatMap((r) => r.items));
  const airing = shows.filter((a) => a.status === "current");
  await primeAniList(airing.map((a) => a.id));
  const now = Date.now();
  const events: IcsEvent[] = [];
  await Promise.all(
    shows.map(async (a) => {
      if (a.status === "current") {
        const info = await getLastAiredBest(a.id);
        const at = info.nextAt ?? a.nextRelease;
        if (!at || new Date(at).getTime() < now - 3600_000) return;
        const ep = info.reliable ? info.lastAired + 1 : null;
        events.push({
          uid: `${a.id}-${ep ?? at.slice(0, 10)}@${new URL(site.url).hostname}`,
          summary: `${a.title} – ${ep ? `Episode ${ep}` : "new episode"}`,
          description: `Japan broadcast time. Streaming services usually follow within a few hours.\\n${abs(ep ? episodePath(a, ep) : animePath(a))}`,
          url: abs(ep ? episodePath(a, ep) : animePath(a)),
          start: at,
          durationMin: a.episodeLength || 24,
        });
      } else if (a.status === "upcoming" && a.startDate && /^\d{4}-\d{2}-\d{2}$/.test(a.startDate) && new Date(`${a.startDate}T23:59:59Z`).getTime() > now) {
        events.push({ uid: `${a.id}-premiere@${new URL(site.url).hostname}`, summary: `Premiere: ${a.title}`, description: abs(animePath(a)), url: abs(animePath(a)), start: a.startDate });
      }
    }),
  );
  events.sort((x, y) => x.start.localeCompare(y.start));
  const name = shows.length === 1 ? `${shows[0].title} · ${site.name}` : `${site.name} – my anime`;
  return new Response(buildIcs(name, events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${shows.length === 1 ? shows[0].slug : "anilumi"}.ics"`,
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}

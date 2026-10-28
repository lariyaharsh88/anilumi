import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminEnabled, isAdmin } from "@/lib/admin";
import { listAnime, animePath } from "@/lib/kitsu";
import Link from "@/components/Link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ e?: string }> };
type Count = { _id: string | null; n: number };

const fmt = (d: Date) => d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

function Login({ e }: { e?: string }) {
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="text-2xl font-bold">Admin</h1>
      <form action="/api/admin/login" method="post" className="card mt-6 space-y-3 p-5">
        <label className="block text-sm"><span className="mb-1 block text-muted">Password (ADMIN_TOKEN)</span><input name="password" type="password" required autoComplete="current-password" className="input" /></label>
        {e === "wrong" && <p className="text-sm text-accent-2">Wrong password.</p>}
        {e === "slow" && <p className="text-sm text-accent-2">Too many attempts. Wait a minute.</p>}
        <button className="btn-primary w-full">Log in</button>
      </form>
    </div>
  );
}

/** Lead and community dashboard. Hidden (404) unless ADMIN_TOKEN is set; password-protected. */
export default async function Admin({ searchParams }: Props) {
  if (!adminEnabled()) notFound();
  if (!(await isAdmin())) return <Login e={(await searchParams).e} />;
  const d = await db().catch(() => null);
  if (!d) return <div className="container-x py-16"><h1 className="text-2xl font-bold">Admin</h1><p className="mt-4 text-muted">Database not configured or unreachable.</p></div>;

  const week = new Date(Date.now() - 7 * 86400000);
  const [total, lastWeek, byKind, bySource, leads, partners, rated, hyped, votes] = await Promise.all([
    d.collection("leads").countDocuments(),
    d.collection("leads").countDocuments({ createdAt: { $gte: week } }),
    d.collection("leads").aggregate<Count>([{ $group: { _id: "$kind", n: { $sum: 1 } } }, { $sort: { n: -1 } }]).toArray(),
    d.collection("leads").aggregate<Count>([{ $group: { _id: "$source", n: { $sum: 1 } } }, { $sort: { n: -1 } }]).toArray(),
    d.collection("leads").find().sort({ createdAt: -1 }).limit(50).toArray(),
    d.collection("partner_leads").find().sort({ createdAt: -1 }).limit(30).toArray(),
    d.collection<{ _id: string; count: number; sum: number }>("rating_stats").find({ count: { $gt: 0 } }).sort({ count: -1 }).limit(10).toArray(),
    d.collection<{ _id: string; count: number }>("hype_stats").find({ count: { $gt: 0 } }).sort({ count: -1 }).limit(10).toArray(),
    Promise.all(["ratings", "reactions", "hype", "poll_votes"].map((c) => d.collection(c).estimatedDocumentCount())),
  ]);
  const ids = [...new Set([...rated, ...hyped].map((r) => r._id))].slice(0, 20);
  const titles = new Map(ids.length ? (await listAnime({ filter: { id: ids.join(",") }, limit: 20, unrated: true })).items.map((a) => [a.id, a]) : []);
  const name = (id: string) => { const a = titles.get(id); return a ? <Link href={animePath(a)} className="text-violet hover:underline">{a.title}</Link> : `#${id}`; };

  return (
    <div className="container-x space-y-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">AniLumi admin</h1>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export?type=leads" className="btn-outline">⬇ Leads CSV</a>
          <a href="/api/admin/export?type=partners" className="btn-outline">⬇ Partners CSV</a>
          <form action="/api/admin/logout" method="post"><button className="btn-outline">Log out</button></form>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[["Email leads", total], ["Leads, last 7 days", lastWeek], ["Partner enquiries", partners.length], ["Ratings", votes[0]], ["Reactions", votes[1]], ["Hype + poll votes", votes[2] + votes[3]]].map(([k, v]) => (
          <div key={k as string} className="card p-3"><p className="text-xs text-muted">{k}</p><p className="text-2xl font-bold tabular-nums">{Number(v).toLocaleString()}</p></div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4"><h2 className="font-semibold">Leads by type</h2><ul className="mt-2 space-y-1 text-sm">{byKind.map((r) => <li key={r._id ?? "-"} className="flex justify-between"><span>{r._id}</span><span className="tabular-nums">{r.n}</span></li>)}</ul></div>
        <div className="card p-4"><h2 className="font-semibold">Leads by CTA</h2><ul className="mt-2 space-y-1 text-sm">{bySource.map((r) => <li key={r._id ?? "-"} className="flex justify-between"><span>{r._id}</span><span className="tabular-nums">{r.n}</span></li>)}</ul></div>
        <div className="card p-4"><h2 className="font-semibold">Most rated</h2><ul className="mt-2 space-y-1 text-sm">{rated.map((r) => <li key={r._id} className="flex justify-between gap-3"><span className="truncate">{name(r._id)}</span><span className="shrink-0 tabular-nums">{(r.sum / r.count).toFixed(1)} · {r.count}</span></li>)}</ul></div>
        <div className="card p-4"><h2 className="font-semibold">Most hyped</h2><ul className="mt-2 space-y-1 text-sm">{hyped.map((r) => <li key={r._id} className="flex justify-between gap-3"><span className="truncate">{name(r._id)}</span><span className="shrink-0 tabular-nums">🔥 {r.count}</span></li>)}</ul></div>
      </section>

      <section>
        <h2 className="h-section mb-3">Partner enquiries</h2>
        {partners.length ? (
          <ul className="space-y-3">
            {partners.map((p) => (
              <li key={String(p._id)} className="card p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p><strong>{p.name}</strong> · <a href={`mailto:${p.email}`} className="text-violet hover:underline">{p.email}</a>{p.company ? ` · ${p.company}` : ""}{p.website ? ` · ${p.website}` : ""}</p>
                  <form action="/api/admin/delete" method="post"><input type="hidden" name="type" value="partner" /><input type="hidden" name="id" value={String(p._id)} /><button className="text-xs text-muted hover:text-accent-2">Delete</button></form>
                </div>
                <p className="mt-1 text-xs text-muted">{fmt(p.createdAt)} IST · {p.type || "No type"} · {p.budget || "No budget"}</p>
                <p className="mt-2 whitespace-pre-line text-ink/90">{p.message}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">None yet.</p>}
      </section>

      <section>
        <h2 className="h-section mb-3">Latest email leads</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted"><tr>{["When (IST)", "Email", "Type", "Anime", "CTA", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {leads.map((l) => (
                <tr key={String(l._id)}>
                  <td className="whitespace-nowrap px-3 py-2">{fmt(l.createdAt)}</td>
                  <td className="px-3 py-2">{l.email}</td>
                  <td className="px-3 py-2">{l.kind}</td>
                  <td className="px-3 py-2">{l.animeTitle || ""}</td>
                  <td className="px-3 py-2">{l.source}</td>
                  <td className="px-3 py-2">{l.status}</td>
                  <td className="px-3 py-2"><form action="/api/admin/delete" method="post"><input type="hidden" name="type" value="lead" /><input type="hidden" name="id" value={String(l._id)} /><button className="text-xs text-muted hover:text-accent-2">Delete</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && <p className="p-4 text-sm text-muted">None yet.</p>}
        </div>
      </section>
    </div>
  );
}

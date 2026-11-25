import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { bountyFigure } from "@/lib/bounties";
import { portrait } from "@/lib/strongest";
import data from "@/data/one-piece-bounties.json";

export const revalidate = 86400;

/**
 * Every One Piece bounty revealed in the story, highest first (data/one-piece-bounties.json): each amount from the
 * One Piece Wiki's bounty list and the character's own page, with the chapter and episode of the reveal. Amounts known
 * only from databooks, magazines, Vivre Cards or exhibition posters are listed as excluded. "one piece bounties" is
 * 2.9K searches a month in the US and 1K in India (Keyword Planner, Nov 2026).
 */
type B = { name: string; slug: string | null; group: string; bounty: number; previous: number | null; revealedChapter: number | null; revealedEpisode: number | null; arc: string; status: "active" | "final" | "unknown"; spoiler: boolean; sources: string[] };
const D = data as unknown as { checked: string; asOf: string; bounties: B[]; excluded: { name: string; why: string }[]; notes: string };
const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const short = (n: number) => (n >= 1e9 ? `${+(n / 1e9).toFixed(3)} billion` : `${Math.round(n / 1e6)} million`);
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
// "Whitebeard", "Big Mom": the name in brackets is the one people use.
const nick = (name: string) => name.match(/\(([^)]+)\)/)?.[1] ?? name;
const all = () => [...D.bounties].sort((a, b) => b.bounty - a.bounty);
const where = (b: B) => [b.revealedChapter ? `ch. ${b.revealedChapter}` : null, b.revealedEpisode ? `ep. ${b.revealedEpisode}` : null].filter(Boolean).join(" · ");

export function generateMetadata(): Metadata {
  const xs = all();
  return {
    title: fitTitle([`One Piece Bounties (${y}): All ${xs.length} Ranked, Highest to Lowest`, `One Piece Bounties Ranked (${y}): All ${xs.length}`, `One Piece Bounties Ranked (${y})`]),
    description: fitDescription(`All ${xs.length} One Piece bounties ranked, from ${nick(xs[0].name)}'s ${short(xs[0].bounty)} down, with the Straw Hats' total, the biggest jumps and where each was revealed.`),
    alternates: { canonical: "/one-piece-bounties" },
  };
}

/** One Piece bounties ranked, with the Straw Hats' total, the biggest jumps and what's left out. */
export default function OnePieceBountiesPage() {
  const xs = all();
  const hats = xs.filter((b) => b.group === "Straw Hat Pirates");
  const crew = hats.reduce((n, b) => n + b.bounty, 0);
  const active = xs.filter((b) => b.status === "active");
  const jumps = xs.filter((b) => b.previous).map((b) => ({ b, d: b.bounty - b.previous! })).sort((a, b) => b.d - a.d).slice(0, 6);
  const luffy = xs.find((b) => b.slug === "luffy-monkey-d");
  const Name = ({ b }: { b: B }) => (b.slug ? <Link href={`/character/${b.slug}`} className="font-medium text-ink hover:text-violet-2 hover:underline">{b.name}</Link> : <span className="font-medium text-ink">{b.name}</span>);

  const faq: FaqItem[] = [
    { q: "Who has the highest bounty in One Piece?", a: `Gol D. Roger, the Pirate King: ${bountyFigure(xs[0].bounty)} berries, the highest ever revealed. Among pirates still at large, ${active[0].name} has the highest at ${bountyFigure(active[0].bounty)}; Kaido and Big Mom, both higher, have had no status since their defeat in Wano.` },
    ...(luffy ? [{ q: "What is Luffy's bounty?", a: `${bountyFigure(luffy.bounty)} berries (${short(luffy.bounty)}), revealed in ${where(luffy)} after he defeated Kaido in Wano.` }] : []),
    { q: "What is the Straw Hat Pirates' total bounty?", a: `${bountyFigure(crew)} berries across all ${hats.length} members: ${list(hats.map((b) => `${nick(b.name)} ${short(b.bounty)}`))}.` },
    { q: "Why is Buggy's bounty so high?", a: "Buggy became one of the Four Emperors as head of Cross Guild, and the story makes a running joke of it: the world takes him for a mastermind because of misunderstandings. His bounty jumped from 15 million to 3,189,000,000." },
    { q: "Why isn't Ace or Sabo on this list?", a: `We list only bounties revealed in a manga chapter or anime episode. ${D.excluded.filter((e) => /Ace|Sabo|Marco/.test(e.name)).map((e) => `${e.name}: ${e.why}`).join(" ")}` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("One Piece bounties ranked", xs.slice(0, 30).map((b) => ({ url: b.slug ? `/character/${b.slug}` : "/one-piece-bounties", name: `${b.name}: ${bountyFigure(b.bounty)} berries` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime/one-piece", label: "One Piece" }, { href: "/one-piece-bounties", label: "Bounties" }]}
        eyebrow="💰 Wanted posters"
        title={<>One Piece bounties, <span className="text-gradient">highest to lowest</span></>}
        subtitle={`All ${xs.length} bounties revealed in the story, as of ${D.asOf}, with where each one was revealed.`}
        facts={[
          { value: short(xs[0].bounty), label: "highest (Roger)" },
          { value: luffy ? short(luffy.bounty) : "–", label: "Luffy" },
          { value: short(crew), label: "Straw Hat total" },
          { value: String(xs.length), label: "bounties" },
        ]}
        hue={45}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/strongest/one-piece" className="chip">⚔️ Strongest One Piece characters</Link>
          <Link href="/anime/one-piece/characters" className="chip">All One Piece characters</Link>
          <Link href="/watch-order/one-piece" className="chip">Watch order</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(D.checked)}>
        The highest bounty in One Piece is Gol D. Roger&apos;s {bountyFigure(xs[0].bounty)} berries, followed by {list(xs.slice(1, 4).map((b) => `${nick(b.name)} (${short(b.bounty)})`))}. {luffy ? `Luffy's is ${bountyFigure(luffy.bounty)}, and the` : "The"} Straw Hats&apos; bounties add up to {bountyFigure(crew)}.
      </AnswerLead>
      <p className="mt-4 max-w-3xl text-xs text-muted">Heads-up for anime-only viewers: most of the current bounties were revealed in the Wano arc (episode 958 onward), so this page spoils who&apos;s worth what.</p>

      <section className="reveal pt-10" aria-labelledby="all-h">
        <h2 id="all-h" className="h-section mb-4">Every bounty, ranked</h2>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line"><th className="py-2 pr-2 font-semibold">#</th><th className="py-2 pr-3 font-semibold">Character</th><th className="py-2 pr-3 text-right font-semibold">Bounty (berries)</th><th className="py-2 pr-3 font-semibold">Group</th><th className="py-2 font-semibold">Revealed</th></tr>
            </thead>
            <tbody>
              {xs.map((b, i) => (
                <tr key={b.name} className="border-b border-line/50 align-middle">
                  <td className="py-2 pr-2 tabular-nums text-muted">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-2.5">
                      <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-bg-2">{portrait(b.slug) && <Image src={portrait(b.slug)!} alt={b.name} fill sizes="32px" className="object-cover object-top" />}</span>
                      <span><Name b={b} />{b.status !== "active" && <span className="block text-[11px] text-muted">{b.status === "final" ? "final bounty" : "status unknown since Wano"}</span>}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums text-ink">{bountyFigure(b.bounty)}</td>
                  <td className="py-2 pr-3 text-ink/80">{b.group}</td>
                  <td className="py-2 text-xs text-muted">{where(b) || b.arc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reveal grid gap-4 pt-10 md:grid-cols-2" aria-label="Straw Hats and biggest jumps">
        <div className="card p-4">
          <h2 className="text-lg font-bold text-ink">Straw Hat Pirates bounties</h2>
          <p className="mt-1 text-sm text-muted">Crew total: <strong className="text-ink">{bountyFigure(crew)}</strong></p>
          <ol className="mt-3 space-y-1.5 text-sm">{hats.map((b) => <li key={b.name} className="flex justify-between gap-3"><Name b={b} /><span className="tabular-nums text-ink/85">{bountyFigure(b.bounty)}</span></li>)}</ol>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-bold text-ink">Biggest bounty jumps</h2>
          <ol className="mt-3 space-y-1.5 text-sm">{jumps.map(({ b, d }) => <li key={b.name} className="flex justify-between gap-3"><Name b={b} /><span className="text-right tabular-nums text-ink/85">+{short(d)}<span className="block text-[11px] text-muted">{short(b.previous!)} → {short(b.bounty)}</span></span></li>)}</ol>
        </div>
      </section>

      <section className="reveal pt-10" aria-labelledby="out-h">
        <h2 id="out-h" className="h-section mb-1">Left out, and why</h2>
        <p className="mb-3 max-w-3xl text-sm text-muted">Only bounties revealed in a manga chapter or anime episode count. These come from databooks, magazines, Vivre Cards or posters, or have no amount yet.</p>
        <ul className="grid gap-2 md:grid-cols-2">{D.excluded.map((e) => <li key={e.name} className="card p-3 text-sm"><span className="font-semibold text-ink">{e.name}:</span> <span className="text-ink/85">{e.why}</span></li>)}</ul>
      </section>

      <MadeBy className="mt-8" method={`Each amount appears on both the One Piece Wiki's bounty list and the character's own wiki page; chapters 1131 to ${D.asOf.match(/ch\. (\d+)/)?.[1] ?? "the latest"} were checked for newer reveals.`} date={D.checked} />
      <Faq title="One Piece bounties: FAQ" items={faq} />
    </div>
  );
}

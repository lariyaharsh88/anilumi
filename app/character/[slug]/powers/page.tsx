import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { snapByPage, snapImage } from "@/lib/charsnap";
import { POWERS_CHECKED, powersFor, powersPath, leadsWithForms, firstSeen, type Ability, type Form } from "@/lib/powers";
import { CHARACTER_VS, vsPath } from "@/lib/charvs";
import { ranking, rankingSlugs, strongestPath } from "@/lib/strongest";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const GROUP: Record<string, string> = { GT: "Dragon Ball GT (not part of the main story)", Daima: "Dragon Ball Daima", Boruto: "Boruto era", other: "Other forms" };

function load(slug: string) {
  const p = powersFor(decodeURIComponent(slug));
  if (!p) notFound();
  const c = snapByPage(decodeURIComponent(slug));
  const short = p.name.split(" ")[p.name.startsWith("Satoru") ? 1 : 0];
  return { p, img: c ? snapImage(c, "large") : null, short, main: p.forms.filter((f) => f.group === "main") };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { p, short, main } = load(slug);
  const forms = leadsWithForms(p);
  return {
    title: fitTitle(forms
      ? [`All ${short} Transformations in Order (${y}): Every Form Explained`, `All ${short} Transformations in Order`, `${short} Transformations in Order`]
      : [`${short}'s Powers Explained: ${list(p.abilities.slice(0, 3).map((a) => a.name.split(" (")[0]))}`, `${short}'s Powers Explained (${y})`, `${short}'s Powers Explained`]),
    description: fitDescription(forms
      ? `Every ${short} transformation in story order, from ${main[0]?.name} to ${main[main.length - 1]?.name}, with where each first appears, plus his techniques and limits. Spoilers hidden.`
      : `${short}'s powers explained in plain English: ${list(p.abilities.slice(0, 4).map((a) => a.name.split(" (")[0]))}, their limits, and who has beaten him. Spoilers hidden until you tap.`),
    alternates: { canonical: powersPath(decodeURIComponent(slug)) },
  };
}

const Spoil = ({ on, children, label = "spoilers, tap to show" }: { on: boolean; children: React.ReactNode; label?: string }) =>
  on ? <details className="group mt-1"><summary className="cursor-pointer list-none text-xs text-muted"><span aria-hidden className="mr-1">🔒</span>{label}</summary><div className="mt-1">{children}</div></details> : <div className="mt-1">{children}</div>;

function Item({ x, n }: { x: Ability | Form; n?: number }) {
  const seen = firstSeen(x);
  return (
    <li className="card p-4 text-sm">
      <p className="font-semibold text-ink">{n ? <span className="mr-1.5 tabular-nums text-muted">{n}.</span> : null}{x.name}</p>
      {"arc" in x && x.arc && !x.spoiler && <p className="text-xs text-muted">{x.arc}</p>}
      <Spoil on={x.spoiler}>
        <p className="leading-6 text-ink/85">{x.what}</p>
        {(seen || ("arc" in x && x.arc && x.spoiler)) && <p className="mt-1 text-xs text-muted">First seen: {[("arc" in x && x.spoiler ? x.arc : null), seen].filter(Boolean).join(" · ")}</p>}
      </Spoil>
    </li>
  );
}

/** A character's powers, forms in story order, limits and who has beaten them. */
export default async function PowersPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const { p, img, short, main } = load(slug);
  const forms = leadsWithForms(p);
  const extra = [...new Set(p.forms.filter((f) => f.group !== "main").map((f) => f.group))];
  const vs = CHARACTER_VS.filter((v) => v.a === slug || v.b === slug);
  const ranked = rankingSlugs().find((s) => ranking(s)!.tiers.some((t) => t.chars.some((c) => c.slug === slug)));

  const faq: FaqItem[] = [
    ...(forms ? [
      { q: `How many transformations does ${short} have?`, a: `${main.length} in the main story, in this order: ${list(main.map((f) => f.name))}.${extra.length ? ` Separate from that: ${list(extra.map((g) => `${p.forms.filter((f) => f.group === g).length} in ${GROUP[g] ?? g}`))}.` : ""}` },
      { q: `What is ${short}'s strongest form?`, a: `The last one in the main story is ${main[main.length - 1].name}. Where it first appears is under its spoiler toggle on this page.` },
    ] : []),
    { q: `What are ${short}'s powers?`, a: `${list(p.abilities.map((a) => a.name))}. ${p.summary}` },
    ...(p.limits.length ? [{ q: `What are ${short}'s weaknesses?`, a: p.limits.filter((l) => !l.spoiler).map((l) => l.what).join(" ") || `They're under the spoiler toggle on this page.` }] : []),
    ...(p.beaten.length ? [{ q: `Who can beat ${short}?`, a: (() => {
      const open = p.beaten.filter((b) => !b.spoiler), hidden = p.beaten.length - open.length;
      return `${open.length ? `In the story: ${list(open.map((b) => b.who))}.` : ""}${hidden ? ` ${hidden} more ${hidden === 1 ? "comes" : "come"} from later arcs and ${hidden === 1 ? "is" : "are"} under spoiler toggles on this page.` : ""}`.trim();
    })() }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", powersPath(slug), forms ? `All ${short} transformations in order` : `${short}'s powers explained`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: `/character/${slug}`, label: p.name }, { href: powersPath(slug), label: forms ? "Transformations" : "Powers" }]}
        eyebrow={`⚡ ${p.series}`}
        title={forms ? <>All {short} transformations <span className="text-gradient">in order</span></> : <>{short}&apos;s powers <span className="text-gradient">explained</span></>}
        subtitle={p.summary}
        facts={[
          ...(main.length ? [{ value: String(main.length), label: "forms in the main story" }] : []),
          { value: String(p.abilities.length), label: "techniques" },
          ...(p.beaten.length ? [{ value: String(p.beaten.length), label: "times beaten or sealed" }] : []),
        ]}
        hue={45}
        posters={img ? [img] : []}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href={`/character/${slug}`} className="chip">{p.name}: age, height &amp; more</Link>
          {ranked && <Link href={strongestPath(ranked)} className="chip">⚔️ Strongest {ranking(ranked)!.name} characters</Link>}
          {vs.map((v) => <Link key={v.slug} href={vsPath(v)} className="chip">{v.an} vs {v.bn}</Link>)}
        </p>
      </PageHero>

      <AnswerLead checked={fmt(POWERS_CHECKED)}>
        {forms
          ? <>{short} has {main.length} transformations in the main story, in this order: {list(main.map((f) => f.name))}.{extra.length ? ` ${list(extra.map((g) => GROUP[g] ?? g))} add${extra.length === 1 ? "s" : ""} more, listed separately.` : ""}</>
          : <>{short}&apos;s main powers are {list(p.abilities.slice(0, 4).map((a) => a.name))}. {p.summary}</>}
      </AnswerLead>

      <p className="mt-4 max-w-3xl text-xs text-muted">Anything first shown in a later arc is hidden until you tap, along with how it happens.</p>

      {forms && (
        <section className="reveal pt-10" aria-labelledby="forms-h">
          <h2 id="forms-h" className="h-section mb-4">Every {short} transformation in order</h2>
          <ol className="grid gap-3 md:grid-cols-2">{main.map((f, i) => <Item key={f.name} x={f} n={i + 1} />)}</ol>
          {extra.map((g) => (
            <div key={g} className="mt-8">
              <h3 className="mb-3 text-base font-semibold text-ink">{GROUP[g] ?? g}</h3>
              <ul className="grid gap-3 md:grid-cols-2">{p.forms.filter((f) => f.group === g).map((f) => <Item key={f.name} x={f} />)}</ul>
            </div>
          ))}
        </section>
      )}

      <section className="reveal pt-10" aria-labelledby="ab-h">
        <h2 id="ab-h" className="h-section mb-4">{forms ? `${short}'s techniques` : `${short}'s powers, one by one`}</h2>
        <ul className="grid gap-3 md:grid-cols-2">{p.abilities.map((a) => <Item key={a.name} x={a} />)}</ul>
      </section>

      {p.limits.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="lim-h">
          <h2 id="lim-h" className="h-section mb-4">Limits and weaknesses</h2>
          <ul className="grid max-w-3xl gap-3">{p.limits.map((l) => <li key={l.what} className="card p-4 text-sm"><Spoil on={l.spoiler} label="A later-arc weakness: tap to show"><p className="leading-6 text-ink/85">{l.what}</p></Spoil></li>)}</ul>
        </section>
      )}

      {p.beaten.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="beat-h">
          <h2 id="beat-h" className="h-section mb-1">Who can beat {short}?</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">Only what happens in the story: who has beaten, matched or sealed {short}.</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {p.beaten.map((b) => (
              <li key={b.who + b.how} className="card p-4 text-sm">
                <p className="font-semibold text-ink">{b.spoiler ? "🔒 " : ""}{b.spoiler ? "Spoiler" : b.who}</p>
                <Spoil on={b.spoiler} label="Who and how: tap to show">
                  {b.spoiler && <p className="font-semibold text-ink">{b.who}</p>}
                  <p className="leading-6 text-ink/85">{b.how}</p>
                  {b.where && <p className="mt-1 text-xs text-muted">{b.where}</p>}
                </Spoil>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.notes && (
        <details className="group mt-8 max-w-3xl text-xs leading-5 text-muted">
          <summary className="cursor-pointer list-none"><span aria-hidden className="mr-1">🔒</span>Notes on canon and sources <span className="group-open:hidden">· may include spoilers</span></summary>
          <p className="mt-2">{p.notes}</p>
        </details>
      )}
      <MadeBy className="mt-8" method="Techniques, forms and fights come from the series wikis and Wikipedia, with first appearances only where a source gives the episode or chapter." date={POWERS_CHECKED} />
      <Faq title={forms ? `${short}'s transformations: FAQ` : `${short}'s powers: FAQ`} items={faq} />
    </div>
  );
}

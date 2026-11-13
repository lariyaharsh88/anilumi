import Image from "next/image";
import Link from "@/components/Link";
import { familyOf, type FamilyNode } from "@/lib/family";

const GEN_LABEL: Record<number, string> = { [-3]: "Ancestors", [-2]: "Grandparents", [-1]: "Parents & elders", 0: "Same generation", 1: "Children", 2: "Grandchildren" };

const Node = ({ n, self = false }: { n: { name: string; relation: string; href: string | null; image: string | null; note?: string }; self?: boolean }) => {
  const initials = n.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
  const body = (
    <>
      <span className={`relative mx-auto block h-16 w-16 overflow-hidden rounded-full border-2 bg-bg-2 ${self ? "border-violet" : "border-line"}`}>
        {n.image ? <Image src={n.image} alt={n.name} fill sizes="64px" className="object-cover object-top" /> : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">{initials}</span>}
      </span>
      <span className={`mt-1.5 block text-sm font-semibold leading-tight ${self ? "text-violet-2" : "text-ink group-hover:text-violet-2"}`}>{n.name}</span>
      <span className="block text-[11px] font-medium uppercase tracking-wide text-accent-2">{n.relation}</span>
      {n.note && <span className="mt-0.5 block text-[11px] text-muted">{n.note}</span>}
    </>
  );
  const cls = `group block w-28 rounded-xl p-2 text-center sm:w-32 ${self ? "bg-violet/10 ring-1 ring-violet/40" : ""}`;
  return n.href && !self ? <Link href={n.href} className={`${cls} transition hover:bg-white/[.04]`}>{body}</Link> : <div className={cls}>{body}</div>;
};

/** Generations as rows joined by connectors, the character in the middle row; spoiler relatives behind a toggle. */
function Rows({ nodes, self }: { nodes: FamilyNode[]; self?: { name: string; image: string | null } }) {
  const gens = [...new Set([...nodes.map((n) => n.gen), ...(self ? [0] : [])])].sort((a, b) => a - b);
  return (
    <div className="flex flex-col items-center">
      {gens.map((g, i) => {
        const row = nodes.filter((n) => n.gen === g);
        return (
          <div key={g} className="w-full">
            {i > 0 && <span aria-hidden className="mx-auto block h-5 w-px bg-gradient-to-b from-line to-violet/50" />}
            <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-muted">{GEN_LABEL[g] ?? "Family"}</p>
            <div className="flex flex-wrap items-start justify-center gap-1 border-t border-line/50 pt-2">
              {g === 0 && self && <Node self n={{ name: self.name, relation: "This character", href: null, image: self.image }} />}
              {row.map((n) => <Node key={`${n.name}-${n.relation}`} n={n} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FamilyTree({ slug, name, image }: { slug: string; name: string; image: string | null }) {
  const fam = familyOf(slug);
  if (!fam) return null;
  const open = fam.nodes.filter((n) => !n.spoiler), hidden = fam.nodes.filter((n) => n.spoiler);
  return (
    <div className="card p-4 sm:p-5">
      {open.length > 0 ? <Rows nodes={open} self={{ name, image }} /> : <p className="text-sm text-muted">{name}&apos;s family is only revealed later in the story.</p>}
      {hidden.length > 0 && (
        <details className="group mt-4 rounded-xl border border-dashed border-line bg-white/[.02] p-3 open:border-solid">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink"><span aria-hidden className="mr-1.5">🔒</span>{hidden.length} more family {hidden.length === 1 ? "member" : "members"} <span className="font-normal text-muted group-open:hidden">· spoilers, tap to show</span></summary>
          <div className="mt-3"><Rows nodes={hidden} /></div>
        </details>
      )}
    </div>
  );
}

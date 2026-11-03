import Link from "@/components/Link";
import NavIcon, { type IconName } from "./NavIcon";

export type Tool = { href: string; title: string; blurb: string; icon: IconName; hue: number };

/**
 * A band of tool cards dropped between the home page's poster rails, so the page alternates between
 * browsing and doing. A swipeable row on phones, a grid from sm up.
 */
export default function ToolBand({ title, eyebrow, tools }: { title: string; eyebrow: string; tools: Tool[] }) {
  return (
    <section className="reveal mt-12" aria-label={title}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-2">{eyebrow}</p>
      <h2 className="h-section mt-1">{title}</h2>
      <ul className="edge-fade -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {tools.map((t) => (
          <li key={t.href} className="w-[72%] shrink-0 snap-start sm:w-auto">
            <Link href={t.href} className="genre-tile card group flex h-full flex-col gap-3 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20" style={{ ["--h" as string]: String(t.hue) }}>
              <span className="genre-ico grid h-10 w-10 place-items-center rounded-xl"><NavIcon name={t.icon} className="h-5 w-5" /></span>
              <span>
                <span className="block font-semibold text-ink">{t.title}</span>
                <span className="mt-0.5 block text-sm leading-5 text-muted">{t.blurb}</span>
              </span>
              <span className="mt-auto text-sm font-medium text-violet group-hover:text-violet-2">Open <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

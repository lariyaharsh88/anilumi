import Image from "next/image";
import Breadcrumbs from "./Breadcrumbs";
import Backdrop from "./fx/Backdrop";

export type HeroFact = { value: string; label: string };
type Crumb = { href: string; label: string };

type Props = {
  crumbs?: Crumb[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small key numbers under the subtitle. */
  facts?: HeroFact[];
  /** Up to 3 poster URLs, fanned out on the right on large screens. */
  posters?: (string | null | undefined)[];
  /** Wide art behind the card (desktop only). */
  backdrop?: string | null;
  /** Aurora tint: hue in degrees (350 pink, 262 violet, 40 gold, 190 cyan, 140 green). */
  hue?: number;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Shared page header: breadcrumbs, then a glowing glass card with eyebrow, gradient title, intro,
 * optional fact tiles and actions, plus a fanned poster collage on desktop. Server component; all motion
 * is CSS (rise / rise-t / aurora) and respects reduced motion.
 */
export default function PageHero({ crumbs, eyebrow, title, subtitle, facts, posters, backdrop, hue = 350, children, className = "" }: Props) {
  const art = (posters || []).filter((p): p is string => Boolean(p)).slice(0, 3);
  const tint = { ["--hue" as string]: String(hue) };
  return (
    <div className={`pt-6 ${className}`}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <header className="grain relative isolate overflow-hidden rounded-3xl border border-white/10 bg-bg-2 shadow-[0_30px_80px_-45px_rgba(0,0,0,.9)]" style={tint}>
        <div className="absolute inset-0 -z-10" aria-hidden>
          {backdrop && <Backdrop src={backdrop} className="opacity-[.30] blur-[1px]" position="center 30%" />}
          <div className="absolute -left-16 -top-24 h-72 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, hsl(var(--hue) 85% 60% / .5), transparent)" }} />
          <div className="absolute -bottom-28 right-0 h-72 w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, hsl(calc(var(--hue) + 70) 80% 62% / .3), transparent)" }} />
          <div className="stars opacity-60" />
          <div className="absolute inset-0 veil-hero" />
        </div>

        <div className={`relative grid gap-6 p-6 sm:p-8 ${art.length ? "lg:grid-cols-[1fr_260px] lg:items-center" : ""}`}>
          <div className="min-w-0">
            {eyebrow && <p className="rise inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-2">{eyebrow}</p>}
            <h1 className="rise-t mt-2 text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl" style={{ ["--d" as string]: "60ms" }}>{title}</h1>
            {subtitle && <div className="rise mt-3 max-w-2xl text-[15px] leading-7 text-ink/75" style={{ ["--d" as string]: "120ms" }}>{subtitle}</div>}
            {facts && facts.length > 0 && (
              <dl className="rise mt-5 flex flex-wrap gap-x-7 gap-y-3" style={{ ["--d" as string]: "180ms" }}>
                {facts.map((f) => (
                  <div key={f.label} className="leading-tight">
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-xl font-bold text-ink">{f.value}</dd>
                    <dd className="text-xs text-muted">{f.label}</dd>
                  </div>
                ))}
              </dl>
            )}
            {children && <div className="rise mt-5" style={{ ["--d" as string]: "220ms" }}>{children}</div>}
          </div>

          {art.length > 0 && (
            <div className="relative hidden h-52 lg:block" aria-hidden>
              {art.map((src, i) => {
                const pos = [
                  { left: "50%", rot: 0, z: 3, scale: 1 },
                  { left: "18%", rot: -10, z: 2, scale: 0.86 },
                  { left: "82%", rot: 10, z: 1, scale: 0.86 },
                ][i];
                return (
                  <div key={src} className="absolute top-1/2 h-48 w-32" style={{ left: pos.left, zIndex: pos.z, transform: `translate(-50%, -50%) rotate(${pos.rot}deg) scale(${pos.scale})` }}>
                    <div className="float-slow relative h-full w-full overflow-hidden rounded-xl border border-white/15 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,.8)]" style={{ ["--delay" as string]: `${i * 0.6}s` }}>
                      <Image src={src} alt="" fill sizes="128px" className="object-cover" />
                      {i > 0 && <div className="absolute inset-0 bg-bg/30" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

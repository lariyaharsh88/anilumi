/**
 * The page's answer in a sentence or two, first thing under the header: the line AI assistants and featured
 * snippets quote ("Yes. One Piece has an official Hindi dub on Crunchyroll…"), with the date the data was checked.
 * Facts only, from the same data as the rest of the page.
 */
/** `label` replaces "Checked" when the date means something else, e.g. "List updated" for a list scanned weekly. */
export default function AnswerLead({ children, checked, label = "Checked", className = "" }: { children: React.ReactNode; checked?: string; label?: string; className?: string }) {
  return (
    <p className={`mt-6 max-w-3xl rounded-2xl border border-violet/30 bg-violet/[.06] px-4 py-3 text-[15px] leading-7 text-ink ${className}`}>
      {children}
      {checked && <span className="ml-1.5 whitespace-nowrap text-xs text-muted">{label} {checked}.</span>}
    </p>
  );
}

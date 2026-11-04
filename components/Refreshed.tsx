/** "Data refreshed 4 Nov 2026" with a machine-readable date: when this page last re-read its sources (ISR). */
export default function Refreshed({ iso, label = "Data refreshed", className = "" }: { iso: string; label?: string; className?: string }) {
  const when = new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return <span className={className}>{label} <time dateTime={iso}>{when}</time></span>;
}

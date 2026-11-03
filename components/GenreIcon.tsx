/**
 * One line icon per main genre (Kitsu category slug), drawn like the header icons (24px grid, currentColor).
 * Shapes adapted from Lucide (ISC licence); the torii gate (historical) is our own. Unknown slugs get a tag.
 */
const ICONS: Record<string, React.ReactNode> = {
  action: <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2" />,
  adventure: <><circle cx="12" cy="12" r="10" /><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36Z" /></>,
  comedy: <><circle cx="12" cy="12" r="10" /><path d="M18 13a6 6 0 0 1-12 0ZM9 9h.01M15 9h.01" /></>,
  drama: <><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01M8.5 12.5v1.2" /></>,
  fantasy: <path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2ZM18 11V4H6v7M15 22v-4a3 3 0 0 0-6 0v4M22 11V9M2 11V9M6 4V2M18 4V2M10 4V2M14 4V2" />,
  romance: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  "science-fiction": <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09ZM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2ZM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />,
  "slice-of-life": <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2" />,
  mystery: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3M9.2 8.6a2 2 0 0 1 3.8.9c0 1.3-2 1.6-2 2.8M11 14.5h.01" /></>,
  horror: <path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8Z" />,
  thriller: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  sports: <><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9a10 10 0 0 1 0 14.2M19.1 4.9a10 10 0 0 0 0 14.2M2 12h20M12 2v20" /></>,
  supernatural: <path d="M9.94 14.06 8 20l-1.94-5.94L1 12l5.06-2.06L8 4l1.94 5.94L15 12ZM18 3v4M16 5h4M19 15v4M17 17h4" />,
  psychological: <path d="M12 5a3 3 0 1 0-6 .13 4 4 0 0 0-2.52 5.77 4 4 0 0 0 .55 6.59A4 4 0 1 0 12 18ZM12 5a3 3 0 1 1 6 .13 4 4 0 0 1 2.52 5.77 4 4 0 0 1-.55 6.59A4 4 0 1 1 12 18ZM12 5v13" />,
  mecha: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  isekai: <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.56v16.88a.5.5 0 0 1-.6.49l-5.6-1.12A1 1 0 0 1 6 19.83V6.17a1 1 0 0 1 .8-.98l5.6-1.12a.5.5 0 0 1 .6.49Z" />,
  historical: <path d="M2.5 4.5c3.5 1.3 15.5 1.3 19 0M4.5 8.5h15M7 6.2V21M17 6.2V21M12 8.5v3.5M5 21h4M15 21h4" />,
  military: <><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8" /><circle cx="12" cy="17" r="5" /></>,
  magic: <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72ZM14 7l3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9" />,
  "school-life": <path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0ZM22 10v6M6 12.5V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-3.5" />,
  shounen: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />,
  shoujo: <><circle cx="12" cy="12" r="3" /><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" /></>,
  seinen: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  josei: <path d="M6 3h12l4 6-10 13L2 9ZM11 3 8 9l4 13 4-13-3-6M2 9h20" />,
  "martial-arts": <><circle cx="12" cy="12" r="10" /><path d="M12 2a5 5 0 0 0 0 10 5 5 0 0 1 0 10" /><circle cx="12" cy="7" r=".6" /><circle cx="12" cy="17" r=".6" /></>,
  parody: <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M8.5 9.5l1.5-1M15 9h.01" /></>,
  space: <><circle cx="12" cy="12" r="3" /><circle cx="19" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><path d="M10.4 21.9a10 10 0 0 0 9.94-15.7M13.5 2.1A10 10 0 0 0 3.57 17.8" /></>,
  "super-power": <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
};
const FALLBACK = <><path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>;

export default function GenreIcon({ slug, className = "h-5 w-5" }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      {ICONS[slug] ?? FALLBACK}
    </svg>
  );
}

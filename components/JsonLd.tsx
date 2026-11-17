/**
 * JSON-LD for a page. Kitsu and AniList titles and synopses are community-edited, so "<" is escaped: a title
 * containing "</script>" can't end the tag and run as HTML.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

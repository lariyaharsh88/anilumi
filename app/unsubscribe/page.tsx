import type { Metadata } from "next";
import Link from "@/components/Link";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ t?: string; done?: string; all?: string }> };

/**
 * The unsubscribe link in every email. Opening it changes nothing (mail scanners open links); the button
 * posts to /api/lead/unsubscribe.
 */
export default async function Unsubscribe({ searchParams }: Props) {
  const { t, done, all } = await searchParams;
  const valid = t && /^[A-Za-z0-9_-]{20,40}$/.test(t);
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-lg p-6 text-center">
        {done === "1" ? (
          <>
            <h1 className="text-2xl font-bold text-ink">You&apos;re unsubscribed</h1>
            <p className="mt-2 text-ink/85">{all ? "You won't get any more AniLumi emails." : "You won't get these emails any more."} Changed your mind? Sign up again from any alert box.</p>
          </>
        ) : valid ? (
          <form action="/api/lead/unsubscribe" method="post">
            <h1 className="text-2xl font-bold text-ink">Unsubscribe?</h1>
            <p className="mt-2 text-ink/85">Stop the emails you get from this list.</p>
            <input type="hidden" name="t" value={t} />
            <label className="mt-4 flex items-center justify-center gap-2 text-sm text-ink/85">
              <input type="checkbox" name="all" value="1" className="h-4 w-4 accent-violet" /> Unsubscribe from all AniLumi emails
            </label>
            <button type="submit" className="btn-primary mt-5 px-5 py-2.5">Unsubscribe</button>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink">That link didn&apos;t work</h1>
            <p className="mt-2 text-ink/85">Use the unsubscribe link at the bottom of any AniLumi email{done === "0" ? "; this one may be incomplete" : ""}.</p>
          </>
        )}
        <p className="mt-5 text-sm"><Link href="/" className="text-violet hover:text-violet-2">Back to AniLumi</Link></p>
      </div>
    </div>
  );
}

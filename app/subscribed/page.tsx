import type { Metadata } from "next";
import Link from "@/components/Link";

export const metadata: Metadata = { title: "Subscribed", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ ok?: string; k?: string; a?: string; p?: string; retry?: string }> };

/** Where the confirmation link lands (app/api/lead/confirm). */
export default async function Subscribed({ searchParams }: Props) {
  const { ok, k, a, p, retry } = await searchParams;
  const what = k === "alert" ? (a ? `${a} episode alerts` : "episode alerts") : k === "digest" ? "the weekly digest" : k === "cheatsheet" ? "season updates" : k === "guide" ? (a ? `${a} guide updates` : "guide updates") : k === "list" ? "episode alerts for the shows on your list" : "AniLumi emails";
  const when = k === "alert" ? "You'll get one email when each new episode airs." : k === "list" ? "You'll get one email as each new episode of a saved show airs. Shows you add on any synced device are included." : k === "digest" ? "The first one arrives on Friday." : "We'll email you only when there's something new.";
  const sheet = p && /^\/season\/\d{4}\/[a-z]+\/cheatsheet$/.test(p) ? p : null;
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-lg p-6 text-center">
        {ok === "1" ? (
          <>
            <p className="text-4xl" aria-hidden>✓</p>
            <h1 className="mt-2 text-2xl font-bold text-ink">You&apos;re confirmed</h1>
            <p className="mt-2 text-ink/85">You&apos;re signed up for {what}. {when}</p>
            {sheet && <p className="mt-3"><Link href={sheet} className="font-semibold text-violet hover:text-violet-2">Open your cheat sheet →</Link></p>}
            <p className="mt-2 text-sm text-muted">Every email has a one-click unsubscribe link.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink">{retry ? "Something went wrong" : "That link didn't work"}</h1>
            <p className="mt-2 text-ink/85">{retry ? "We couldn't reach our database. Please tap the link in the email again in a minute." : "It may be old or already used. Sign up again from any alert box and we'll send a fresh link."}</p>
          </>
        )}
        <p className="mt-5"><Link href="/" className="btn-primary px-5 py-2.5">Back to AniLumi</Link></p>
      </div>
    </div>
  );
}

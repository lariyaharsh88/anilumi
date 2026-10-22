"use client";

/** Shown when an upstream (Kitsu) outage makes a page impossible to render; never cached as a 404. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-5xl font-black text-accent">Hmm.</p>
      <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t load this page right now.</h1>
      <p className="mt-2 text-muted">Our anime data source didn&apos;t answer. This is usually over in a minute.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );
}

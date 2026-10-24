import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl font-black text-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold">That page wandered off into another isekai.</h1>
      <p className="mt-2 text-muted">The title may have been renamed or removed from the catalogue.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn-primary">Home</Link><Link href="/search" className="btn-outline">Search</Link><Link href="/random" prefetch={false} className="btn-outline">Random anime 🎲</Link></div>
    </div>
  );
}

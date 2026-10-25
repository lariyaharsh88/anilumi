import type { Metadata } from "next";
import Q, { generateMetadata as qMetadata } from "./q/page";

// Plain URL: no query string, so it can be cached. Filtered variants are rewritten to ./q.
export const revalidate = 86400;
const none = Promise.resolve({});

export async function generateMetadata(): Promise<Metadata> {
  return qMetadata({ searchParams: none });
}

export default async function Page() {
  return Q({ searchParams: none });
}

import type { Metadata } from "next";
import Q, { generateMetadata as qMetadata } from "./q/page";
import { generateStaticParamsList } from "./q/params";

// Plain URL: no query string, so it can be cached. ?page=/?sort= variants are rewritten to ./q.
// 6 hours: a season's list changes slowly (ratings, popularity), and each render is the Worker's costliest work.
export const revalidate = 21600;
export async function generateStaticParams() { return generateStaticParamsList(); }

type Props = { params: Promise<{ year: string; season: string }> };
const none = Promise.resolve({});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return qMetadata({ params, searchParams: none });
}

export default async function Page({ params }: Props) {
  return Q({ params, searchParams: none });
}

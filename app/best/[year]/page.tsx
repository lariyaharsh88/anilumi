import type { Metadata } from "next";
import Q, { generateMetadata as qMetadata, generateStaticParamsList } from "./q/page";

// Plain URL: no query string, so it can be cached. ?page=/?sort= variants are rewritten to ./q.
export const revalidate = 86400;
export async function generateStaticParams() { return generateStaticParamsList(); }

type Props = { params: Promise<{ year: string }> };
const none = Promise.resolve({});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return qMetadata({ params, searchParams: none });
}

export default async function Page({ params }: Props) {
  return Q({ params, searchParams: none });
}

import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link with prefetching off by default. Viewport prefetching made every visible card render its
 * target page on the server, so one visit to a list page could build and cache dozens of pages nobody
 * opened. Pass prefetch explicitly where a link is worth warming.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}

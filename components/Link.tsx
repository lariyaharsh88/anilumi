"use client";
import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * next/link that prefetches on intent, not on sight. Viewport prefetching made every visible card render its
 * target page on the server, so one visit to a list page built dozens of pages nobody opened. Hovering or
 * touching a link turns its prefetch on, which starts loading the next page a few hundred milliseconds before
 * the click (the edge Worker caches the payload). Pass prefetch explicitly to prefetch on sight.
 */
export default function Link({ prefetch, onMouseEnter, onTouchStart, onFocus, ...props }: ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false);
  const want = () => setIntent(true);
  return (
    <NextLink
      prefetch={prefetch ?? (intent ? true : false)}
      onMouseEnter={(e) => { want(); onMouseEnter?.(e); }}
      onTouchStart={(e) => { want(); onTouchStart?.(e); }}
      onFocus={(e) => { want(); onFocus?.(e); }}
      {...props}
    />
  );
}

import { getImageProps } from "next/image";

const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Large art behind a hero, desktop only. On phones the <picture> resolves to a 1px transparent GIF, so
 * no big image downloads there and it never competes for Largest Contentful Paint. Works in server and
 * client components.
 */
// `alt`: decorative art sits under aria-hidden, so screen readers skip it either way; a short description stops
// Bing's "img without ALT" report counting alt="" as missing.
export default function Backdrop({ src, className = "", position = "center", alt = "" }: { src: string; className?: string; position?: string; alt?: string }) {
  const { props } = getImageProps({ src, alt, fill: true, sizes: "1400px", quality: 50 });
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={props.srcSet || props.src} sizes="1400px" />
      <img src={BLANK} alt={alt} decoding="async" className={`absolute inset-0 h-full w-full object-cover ${className}`} style={{ objectPosition: position }} />
    </picture>
  );
}

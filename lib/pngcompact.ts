import UPNG from "upng-js";

/**
 * Satori renders full-colour PNG only, and with poster art that came out at 400-760 KB. WhatsApp shows no preview
 * for a link whose og:image is over ~300 KB, so every card is reduced to a 256-colour palette here: 90-160 KB, and
 * the posters and text look the same (a faint banding in the background gradient at most). Pure JS, ~120 ms.
 * If decoding fails for any reason the original PNG is served.
 */
export async function compactPng(res: Response): Promise<Response> {
  const buf = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  try {
    const img = UPNG.decode(buf);
    const png = UPNG.encode([UPNG.toRGBA8(img)[0]], img.width, img.height, 256);
    headers.delete("content-length");
    return new Response(png, { status: res.status, headers });
  } catch {
    return new Response(buf, { status: res.status, headers });
  }
}

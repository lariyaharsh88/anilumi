/**
 * Renders every icon from the single mark in lib/brand.ts:
 *   app/favicon.ico (16/32/48) · app/icon.svg · app/apple-icon.png (180, full bleed)
 *   public/icons/icon-192.png, icon-512.png, maskable-512.png · public/brand/anilumi-mark.svg, -1024.png
 * Run after changing the mark:  npx tsx scripts/build-icons.mts  (PREVIEW=<dir> also writes a contact sheet)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { markSvg } from "../lib/brand.ts";

const root = new URL("..", import.meta.url).pathname;
const png = (svg: string, size: number) => sharp(Buffer.from(svg), { density: Math.max(72, (size / 64) * 72) }).resize(size, size).png().toBuffer();

/** ICO with PNG-compressed entries (supported by every browser since IE Vista). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const head = Buffer.alloc(6 + images.length * 16);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const o = 6 + i * 16;
    head.writeUInt8(size >= 256 ? 0 : size, o); head.writeUInt8(size >= 256 ? 0 : size, o + 1);
    head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3); head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(data.length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((x) => x.data)]);
}

mkdirSync(`${root}public/icons`, { recursive: true });
mkdirSync(`${root}public/brand`, { recursive: true });
const tile = markSvg();
writeFileSync(`${root}app/icon.svg`, tile);
writeFileSync(`${root}public/brand/anilumi-mark.svg`, tile);
writeFileSync(`${root}app/favicon.ico`, ico(await Promise.all([16, 32, 48].map(async (s) => ({ size: s, data: await png(markSvg({ size: s }), s) })))));
writeFileSync(`${root}app/apple-icon.png`, await png(markSvg({ shape: "bleed" }), 180));
writeFileSync(`${root}public/icons/icon-192.png`, await png(tile, 192));
writeFileSync(`${root}public/icons/icon-512.png`, await png(tile, 512));
writeFileSync(`${root}public/icons/maskable-512.png`, await png(markSvg({ shape: "maskable" }), 512));
writeFileSync(`${root}public/brand/anilumi-mark-1024.png`, await png(tile, 1024));

if (process.env.PREVIEW) {
  const sizes = [256, 128, 64, 32, 16];
  const W = 640, H = 600;
  const comp: sharp.OverlayOptions[] = [];
  let x = 20;
  for (const s of sizes) {
    const img = await png(markSvg({ size: s }), s);
    comp.push({ input: img, left: x, top: 20 }, { input: img, left: x, top: 320 });
    x += s + 22;
  }
  comp.push({ input: await png(markSvg({ shape: "maskable" }), 160), left: 20, top: 420 - 0 + 0 > 0 ? 430 : 430 });
  await sharp({ create: { width: W, height: H, channels: 4, background: "#0b0d13" } })
    .composite([{ input: Buffer.from(`<svg width="${W}" height="${H}"><rect y="300" width="${W}" height="${H - 300}" fill="#f2f4f8"/></svg>`), left: 0, top: 0 }, ...comp])
    .png().toFile(`${process.env.PREVIEW}/sheet.png`);
}
console.log("icons written");

import { exposureLine, hasExposure, type ShotData } from "@/lib/exif";

export type FrameStyle = "light" | "dark" | "none";

export interface FrameOptions {
  style: FrameStyle;
  showDate: boolean;
  locale: string;
}

const PALETTE = {
  light: { bg: "#ffffff", fg: "#161616", muted: "#8a8a8a" },
  dark: { bg: "#111111", fg: "#f2f2f2", muted: "#8f8f8f" },
} as const;

const SANS = '"Inter Variable", ui-sans-serif, system-ui, sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, Menlo, monospace';

/** Safari en iOS no crea canvas de más de ~16,7 MP: el export se escala para caber. */
const MAX_AREA = 16_000_000;

/** El canvas no espera a las fuentes web: hay que cargarlas antes de dibujar texto. */
export const fontsReady = () =>
  Promise.all([
    document.fonts.load(`600 32px ${SANS}`),
    document.fonts.load(`400 32px ${SANS}`),
    document.fonts.load(`500 32px ${MONO}`),
  ]).catch(() => undefined);

const secondaryLine = (d: ShotData) => {
  if (d.lens) return d.lens;
  if (d.focal35 && d.focal35 !== Math.round(d.focal ?? 0)) return `${d.focal35}mm eq.`;
  return undefined;
};

const dateLine = (d: ShotData, locale: string) =>
  d.date?.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

/** Geometría del marco en píxeles de la foto original. */
export function frameLayout(w: number, h: number, data: ShotData, style: FrameStyle) {
  if (style === "none") return { width: w, height: h, pad: 0, strip: 0 };
  // Medida base = promedio de los lados: el marco se ve igual de proporcionado en vertical y horizontal.
  const base = (w + h) / 2;
  const pad = Math.round(base * 0.024);
  const hasText = Boolean(data.camera || hasExposure(data) || data.date);
  const strip = hasText ? Math.round(base * 0.125) : pad;
  return { width: w + pad * 2, height: h + pad + strip, pad, strip };
}

function draw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, data: ShotData, opts: FrameOptions) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const { width, height, pad, strip } = frameLayout(w, h, data, opts.style);

  if (opts.style === "none") {
    ctx.drawImage(img, 0, 0, w, h);
    return;
  }

  const c = PALETTE[opts.style];
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, pad, pad, w, h);

  const left = [data.camera, secondaryLine(data)];
  const right = [exposureLine(data), opts.showDate ? dateLine(data, opts.locale) : undefined];
  if (!left.some(Boolean) && !right.some(Boolean)) return;

  // Dos líneas por lado: principal fuerte, secundaria en gris. Si no caben, se achica todo junto.
  let size = strip * 0.22;
  const fonts = (s: number) => ({
    leftMain: `600 ${s}px ${SANS}`,
    leftSub: `400 ${s * 0.74}px ${SANS}`,
    rightMain: `500 ${s * 0.86}px ${MONO}`,
    rightSub: `400 ${s * 0.74}px ${SANS}`,
  });
  const widest = (s: number) => {
    const f = fonts(s);
    const measure = (font: string, t?: string) => {
      if (!t) return 0;
      ctx.font = font;
      return ctx.measureText(t).width;
    };
    return (
      Math.max(measure(f.leftMain, left[0]), measure(f.leftSub, left[1])) +
      Math.max(measure(f.rightMain, right[0]), measure(f.rightSub, right[1]))
    );
  };
  const available = width - pad * 2 - pad * 1.5;
  const used = widest(size);
  if (used > available) size *= available / used;

  const f = fonts(size);
  const mid = h + pad + strip / 2;
  const mainY = mid - size * 0.08;
  const subY = mid + size * 0.95;

  const line = (font: string, color: string, t: string | undefined, x: number, y: number, align: CanvasTextAlign) => {
    if (!t) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(t, x, y);
  };

  // Con una sola línea por lado, se centra verticalmente en la franja.
  const leftSolo = !left[1];
  const rightSolo = !right[1];
  line(f.leftMain, c.fg, left[0] ?? left[1], pad, leftSolo ? mid + size * 0.35 : mainY, "left");
  if (left[0]) line(f.leftSub, c.muted, left[1], pad, subY, "left");
  line(f.rightMain, c.fg, right[0] || right[1], width - pad, rightSolo ? mid + size * 0.3 : mainY, "right");
  if (right[0]) line(f.rightSub, c.muted, right[1], width - pad, subY, "right");
}

/** Dibuja en un canvas visible, escalado para caber en `maxWidth` píxeles CSS. */
export function renderPreview(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  data: ShotData,
  opts: FrameOptions,
  maxWidth: number,
) {
  const { width, height } = frameLayout(img.naturalWidth, img.naturalHeight, data, opts.style);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.min(1, (maxWidth * dpr) / width);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  draw(ctx, img, data, opts);
}

/** Export a resolución completa (o al máximo que permita el navegador). El JPEG sale sin metadatos. */
export async function exportFrame(img: HTMLImageElement, data: ShotData, opts: FrameOptions): Promise<Blob> {
  const { width, height } = frameLayout(img.naturalWidth, img.naturalHeight, data, opts.style);
  const scale = Math.min(1, Math.sqrt(MAX_AREA / (width * height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.scale(scale, scale);
  draw(ctx, img, data, opts);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/jpeg", 0.92),
  );
}

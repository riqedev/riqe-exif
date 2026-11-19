import { useEffect, useRef, useState } from "react";
import type { ShotData } from "@/lib/exif";
import { fontsReady, renderPreview, type FrameOptions } from "@/lib/frame";
import { useT } from "@/lib/i18n";

interface FramePreviewProps {
  img: HTMLImageElement;
  data: ShotData;
  options: FrameOptions;
}

/** Vista previa = el mismo dibujo del export, a la resolución de pantalla. Lo que ves es lo que bajas. */
export function FramePreview({ img, data, options }: FramePreviewProps) {
  const t = useT();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [fontsOk, setFontsOk] = useState(false);

  useEffect(() => {
    void fontsReady().then(() => setFontsOk(true));
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvas.current || !width || !fontsOk) return;
    renderPreview(canvas.current, img, data, options, width);
  }, [img, data, options, width, fontsOk]);

  return (
    <div ref={wrap} className="flex w-full justify-center">
      <canvas
        ref={canvas}
        role="img"
        aria-label={t.preview}
        className="block h-auto max-h-[72dvh] w-auto max-w-full rounded-sm shadow-[0_24px_60px_-28px_oklch(0_0_0/0.6)]"
      />
    </div>
  );
}

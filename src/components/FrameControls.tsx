import { Download, LoaderCircle } from "lucide-react";
import type { FrameStyle } from "@/lib/frame";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface FrameControlsProps {
  style: FrameStyle;
  onStyle: (s: FrameStyle) => void;
  showDate: boolean;
  onShowDate: (v: boolean) => void;
  hasDate: boolean;
  exporting: boolean;
  onDownload: () => void;
}

const STYLES: FrameStyle[] = ["light", "dark", "none"];

export function FrameControls(p: FrameControlsProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div role="radiogroup" aria-label={t.frame} className="flex rounded-lg border border-border p-0.5">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={p.style === s}
              onClick={() => p.onStyle(s)}
              className={cn(
                "pressable h-8 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                p.style === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t[s]}
            </button>
          ))}
        </div>

        {p.hasDate && (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 text-sm select-none",
              p.style === "none" ? "pointer-events-none opacity-40" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <input
              type="checkbox"
              checked={p.showDate}
              disabled={p.style === "none"}
              onChange={(e) => p.onShowDate(e.target.checked)}
              className="size-4 accent-current"
            />
            {t.showDate}
          </label>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
        <button
          type="button"
          onClick={p.onDownload}
          disabled={p.exporting}
          className="pressable flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
        >
          {p.exporting ? (
            <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
          ) : (
            <Download size={16} aria-hidden="true" />
          )}
          {p.exporting ? t.exporting : t.download}
        </button>
        <span className="text-center text-xs text-muted-foreground sm:text-right">{t.downloadNote}</span>
      </div>
    </div>
  );
}

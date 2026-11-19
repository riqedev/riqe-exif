import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface DropZoneProps {
  onFile: (file: File) => void;
  error?: string;
}

/** Pantalla inicial: soltar, elegir o pegar (⌘V) una foto. */
export function DropZone({ onFile, error }: DropZoneProps) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={cn(
        "relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-dashed px-6 py-14 text-center transition-colors duration-200 sm:px-12 sm:py-20",
        over ? "border-foreground/50 bg-muted/40" : "border-border",
      )}
    >
      <Corners />
      <ImageUp size={28} strokeWidth={1.5} aria-hidden="true" className="text-hud" />
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.dropTitle}</h1>
        <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
          {t.dropBody}
        </p>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="pressable h-10 rounded-lg bg-foreground px-5 text-sm font-medium text-background outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {t.choose}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <p className="osd text-[10px] text-hud-faint">{t.formats}</p>
      {error && (
        <p role="alert" className="text-sm text-rec">
          {error}
        </p>
      )}
    </div>
  );
}

/** Esquinas de visor: el único guiño de cámara de la pantalla vacía. */
const Corners = () => (
  <div aria-hidden="true" className="pointer-events-none absolute -inset-px">
    {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map(
      (pos) => (
        <span key={pos} className={cn("absolute size-4 rounded-[3px] border-foreground/40", pos)} />
      ),
    )}
  </div>
);

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
      <ImageUp size={28} strokeWidth={1.5} aria-hidden="true" className="text-muted-foreground" />
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.dropTitle}</h1>
        <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
          {t.dropBody}
        </p>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="pressable h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      <p className="text-xs text-muted-foreground">{t.formats}</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Esquinas de visor: el único guiño de cámara de la pantalla vacía. */
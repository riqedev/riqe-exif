import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { FramePreview } from "@/components/FramePreview";
import { FrameControls } from "@/components/FrameControls";
import { PrivacyPanel, ShotPanel } from "@/components/ShotPanel";
import { readShot, type ShotData } from "@/lib/exif";
import { exportFrame, fontsReady, type FrameStyle } from "@/lib/frame";
import { COPY, LOCALE_STORAGE_KEY, LocaleContext, detectLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface Photo {
  file: File;
  url: string;
  img: HTMLImageElement;
  data: ShotData;
}

const isImage = (f: File) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);

export default function App() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const t = COPY[locale];
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string>();
  const [style, setStyle] = useState<FrameStyle>("light");
  const [showDate, setShowDate] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Sin storage: vale para esta visita.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const load = useCallback(
    async (file: File) => {
      setError(undefined);
      if (!isImage(file)) return setError(t.notImage);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
      } catch {
        URL.revokeObjectURL(url);
        return setError(t.cantOpen);
      }
      const data = await readShot(file);
      setPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { file, url, img, data };
      });
      setShowDate(Boolean(data.date));
    },
    [t],
  );

  // Pegar una imagen (⌘V / Ctrl+V) también la carga.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files[0];
      if (file) void load(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [load]);

  const options = useMemo(() => ({ style, showDate, locale }), [style, showDate, locale]);

  const download = async () => {
    if (!photo) return;
    setExporting(true);
    setError(undefined);
    try {
      await fontsReady();
      const blob = await exportFrame(photo.img, photo.data, options);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${photo.file.name.replace(/\.[^.]+$/, "")}-${style === "none" ? "clean" : "frame"}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      setError(t.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <div
        className="flex min-h-dvh flex-col"
        onDragOver={(e) => {
          if (!photo) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          if (!photo) return;
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void load(file);
        }}
      >
        <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
          <div className="osd flex items-center gap-4 text-[11px]">
            <span className="tracking-[0.2em] text-hud-strong">RIQE EXIF</span>
            <span className="flex items-center gap-1.5 text-hud">
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", photo ? "bg-af" : "bg-hud-faint")}
              />
              {photo ? "PLAYBACK" : "STANDBY"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {photo && (
              <>
                <button
                  type="button"
                  onClick={() => picker.current?.click()}
                  className="pressable h-8 rounded-md px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {t.another}
                </button>
                <input
                  ref={picker}
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void load(file);
                    e.target.value = "";
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              aria-label={t.switchTo}
              className="osd pressable h-8 rounded-md px-2.5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {locale.toUpperCase()}
            </button>
          </div>
        </header>

        {!photo ? (
          <main className="flex flex-1 items-center px-5 pb-10 sm:px-8">
            <DropZone onFile={(f) => void load(f)} error={error} />
          </main>
        ) : (
          <main
            className={cn(
              "mx-auto grid w-full max-w-7xl flex-1 content-start gap-6 px-5 pb-10 transition-opacity sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10",
              dragging && "opacity-50",
            )}
          >
            <div className="flex min-w-0 flex-col gap-6">
              <FramePreview img={photo.img} data={photo.data} options={options} />
              <FrameControls
                style={style}
                onStyle={setStyle}
                showDate={showDate}
                onShowDate={setShowDate}
                hasDate={Boolean(photo.data.date)}
                exporting={exporting}
                onDownload={() => void download()}
              />
              {error && (
                <p role="alert" className="text-sm text-rec">
                  {error}
                </p>
              )}
            </div>
            <aside className="flex flex-col gap-4">
              <ShotPanel data={photo.data} width={photo.img.naturalWidth} height={photo.img.naturalHeight} />
              <PrivacyPanel data={photo.data} />
            </aside>
          </main>
        )}

        <footer className="flex flex-col gap-1 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
          <span>{t.local}</span>
          <span>
            {t.by}{" "}
            <a
              href="https://riqedev.github.io"
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
            >
              riqedev
            </a>
          </span>
        </footer>
      </div>
    </LocaleContext.Provider>
  );
}

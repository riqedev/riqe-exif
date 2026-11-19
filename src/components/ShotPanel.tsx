import type { ReactNode } from "react";
import { MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  formatAperture,
  formatEv,
  formatFocal,
  formatShutter,
  hasExposure,
  sensitiveCount,
  type ShotData,
} from "@/lib/exif";
import { useLocale, useT } from "@/lib/i18n";

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-6 border-b border-border py-2.5 last:border-b-0">
    <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right text-sm font-medium text-pretty">{children}</dd>
  </div>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="surface rounded-xl p-5">
    <h2 className="osd mb-3 text-[10px] text-hud">{title}</h2>
    {children}
  </section>
);

export function ShotPanel({ data, width, height }: { data: ShotData; width: number; height: number }) {
  const t = useT();
  const { locale } = useLocale();
  const empty = !data.camera && !data.lens && !hasExposure(data) && !data.date;
  const mp = ((width * height) / 1e6).toFixed(1);

  return (
    <Panel title={t.shot}>
      {empty && <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t.noExif}</p>}
      <dl>
        {data.camera && <Row label={t.camera}>{data.camera}</Row>}
        {data.lens && <Row label={t.lens}>{data.lens}</Row>}
        {data.focal && (
          <Row label={t.focal}>
            <span className="font-mono">{formatFocal(data.focal)}</span>
            {data.focal35 && data.focal35 !== Math.round(data.focal) && (
              <span className="font-mono text-muted-foreground">
                {" "}
                ({data.focal35}mm {t.equivalent})
              </span>
            )}
          </Row>
        )}
        {data.aperture && (
          <Row label={t.aperture}>
            <span className="font-mono">{formatAperture(data.aperture)}</span>
          </Row>
        )}
        {data.shutter && (
          <Row label={t.shutter}>
            <span className="font-mono">{formatShutter(data.shutter)}</span>
          </Row>
        )}
        {data.iso && (
          <Row label={t.iso}>
            <span className="font-mono">{data.iso}</span>
          </Row>
        )}
        {data.ev !== undefined && (
          <Row label={t.ev}>
            <span className="font-mono">{formatEv(data.ev)} EV</span>
          </Row>
        )}
        {data.date && (
          <Row label={t.date}>
            {data.date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
          </Row>
        )}
        {data.software && <Row label={t.software}>{data.software}</Row>}
        <Row label={t.size}>
          <span className="font-mono">
            {width} × {height}
          </span>{" "}
          <span className="font-mono text-muted-foreground">({mp} MP)</span>
        </Row>
      </dl>
    </Panel>
  );
}

export function PrivacyPanel({ data }: { data: ShotData }) {
  const t = useT();
  const s = data.sensitive;
  const count = sensitiveCount(s);

  if (count === 0) {
    return (
      <Panel title={t.privacy}>
        <p className="flex items-start gap-2.5 text-sm leading-relaxed">
          <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-af" />
          {t.clean}
        </p>
      </Panel>
    );
  }

  const items: { label: string; value?: ReactNode }[] = [];
  if (s.gps) {
    const { lat, lon } = s.gps;
    items.push({
      label: t.gps,
      value: (
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        >
          <MapPin size={12} aria-hidden="true" />
          {t.map}
        </a>
      ),
    });
  }
  if (s.serial) items.push({ label: t.serial, value: <span className="font-mono">{s.serial}</span> });
  if (s.lensSerial) items.push({ label: t.lensSerial, value: <span className="font-mono">{s.lensSerial}</span> });
  if (s.owner) items.push({ label: t.owner, value: s.owner });
  if (s.artist) items.push({ label: t.artist, value: s.artist });
  if (s.copyright) items.push({ label: t.copyright, value: s.copyright });

  return (
    <Panel title={t.privacy}>
      <p className="mb-2 flex items-start gap-2.5 text-sm font-medium">
        <ShieldAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
        {t.found}
      </p>
      <dl>
        {items.map((i) => (
          <Row key={i.label} label={i.label}>
            {i.value}
          </Row>
        ))}
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.stripped}</p>
    </Panel>
  );
}

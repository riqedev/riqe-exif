import exifr from "exifr";

/** Datos de toma normalizados. Todo es opcional: muchas fotos (capturas, apps) no traen EXIF. */
export interface ShotData {
  camera?: string;
  lens?: string;
  focal?: number;
  focal35?: number;
  aperture?: number;
  shutter?: number;
  iso?: number;
  ev?: number;
  date?: Date;
  software?: string;
  width?: number;
  height?: number;
  sensitive: SensitiveData;
}

/** Lo que identifica a la persona o el lugar. El export nunca lo incluye. */
export interface SensitiveData {
  gps?: { lat: number; lon: number };
  serial?: string;
  lensSerial?: string;
  owner?: string;
  artist?: string;
  copyright?: string;
}

const MAKES: Record<string, string> = {
  SONY: "Sony",
  "NIKON CORPORATION": "Nikon",
  NIKON: "Nikon",
  FUJIFILM: "Fujifilm",
  "OLYMPUS IMAGING CORP.": "Olympus",
  "OLYMPUS CORPORATION": "Olympus",
  "OM DIGITAL SOLUTIONS": "OM System",
  "RICOH IMAGING COMPANY, LTD.": "Ricoh",
  PENTAX: "Pentax",
  "LEICA CAMERA AG": "Leica",
  "PANASONIC": "Panasonic",
};

const ROMAN = ["", "", "II", "III", "IV", "V", "VI"];

/** ILCE-6400 → α6400, ILCE-7RM5 → α7R V. Sony solo publica el código en el EXIF. */
const sonyAlpha = (model: string) => {
  const m = /^ILCE-(\d+)([A-Z]*?)(?:M(\d))?$/.exec(model);
  if (!m) return model;
  const [, num, suffix, gen] = m;
  return `α${num}${suffix}${gen ? ` ${ROMAN[Number(gen)] ?? `M${gen}`}` : ""}`;
};

export const cameraName = (make?: string, model?: string) => {
  const cleanMake = make ? (MAKES[make.trim().toUpperCase()] ?? make.trim()) : "";
  let cleanModel = model?.trim() ?? "";
  if (cleanMake === "Sony") cleanModel = sonyAlpha(cleanModel);
  // Canon y Apple repiten la marca en el modelo ("Canon EOS R6"): no la duplicamos.
  if (cleanMake && cleanModel.toLowerCase().startsWith(cleanMake.toLowerCase())) return cleanModel;
  return [cleanMake, cleanModel].filter(Boolean).join(" ") || undefined;
};

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);

export async function readShot(file: File): Promise<ShotData> {
  let raw: Record<string, unknown> | undefined;
  try {
    raw = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd1: false,
      xmp: false,
      icc: false,
      iptc: false,
      mergeOutput: true,
    });
  } catch {
    raw = undefined;
  }
  if (!raw) return { sensitive: {} };

  const lat = raw.latitude;
  const lon = raw.longitude;
  const date = raw.DateTimeOriginal ?? raw.CreateDate;

  return {
    camera: cameraName(text(raw.Make), text(raw.Model)),
    lens: text(raw.LensModel),
    focal: num(raw.FocalLength),
    focal35: num(raw.FocalLengthIn35mmFormat),
    aperture: num(raw.FNumber),
    shutter: num(raw.ExposureTime),
    iso: num(raw.ISO),
    ev: typeof raw.ExposureCompensation === "number" ? raw.ExposureCompensation : undefined,
    date: date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined,
    software: text(raw.Software),
    width: num(raw.ExifImageWidth),
    height: num(raw.ExifImageHeight),
    sensitive: {
      gps: typeof lat === "number" && typeof lon === "number" ? { lat, lon } : undefined,
      serial: text(raw.BodySerialNumber) ?? text(raw.SerialNumber),
      lensSerial: text(raw.LensSerialNumber),
      owner: text(raw.CameraOwnerName) ?? text(raw.OwnerName),
      artist: text(raw.Artist),
      copyright: text(raw.Copyright),
    },
  };
}

/* ---------- Formato, con la notación de la cámara (F2.8, 1/250, ISO 100) ---------- */

const trim = (n: number, digits = 1) => String(Number(n.toFixed(digits)));

export const formatShutter = (s: number) => (s >= 0.3 ? `${trim(s)}"` : `1/${Math.round(1 / s)}`);
export const formatAperture = (f: number) => `F${f >= 10 ? Math.round(f) : f.toFixed(1)}`;
export const formatFocal = (mm: number) => `${trim(mm)}mm`;
export const formatIso = (iso: number) => `ISO ${iso}`;
export const formatEv = (ev: number) => (ev === 0 ? "±0.0" : `${ev > 0 ? "+" : "−"}${Math.abs(ev).toFixed(1)}`);

/** Línea de exposición del marco: "35mm  F1.8  1/250  ISO 100". Omite lo que no venga. */
export const exposureLine = (d: ShotData) =>
  [
    d.focal && formatFocal(d.focal),
    d.aperture && formatAperture(d.aperture),
    d.shutter && formatShutter(d.shutter),
    d.iso && formatIso(d.iso),
  ]
    .filter(Boolean)
    .join("   ");

export const hasExposure = (d: ShotData) => Boolean(d.focal || d.aperture || d.shutter || d.iso);

export const sensitiveCount = (s: SensitiveData) => Object.values(s).filter(Boolean).length;

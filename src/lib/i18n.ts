import { createContext, useContext } from "react";

export type Locale = "es" | "en";
export const LOCALE_STORAGE_KEY = "riqe-exif-locale";

export const detectLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // Storage bloqueado: idioma del navegador.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
};

const es = {
  dropTitle: "Suelta una foto",
  dropBody: "Lee la cámara, el lente y la exposición, te avisa si trae tu ubicación y exporta una versión con marco y sin metadatos.",
  choose: "Elegir foto",
  formats: "JPG, PNG o WebP. HEIC solo en Safari.",
  local: "Todo pasa en tu navegador: la foto no se sube a ningún servidor.",
  another: "Otra foto",
  shot: "Datos de toma",
  camera: "Cámara",
  lens: "Lente",
  focal: "Focal",
  equivalent: "eq.",
  aperture: "Apertura",
  shutter: "Velocidad",
  iso: "ISO",
  ev: "Compensación",
  date: "Fecha",
  software: "Software",
  size: "Tamaño",
  noExif:
    "Esta foto no trae datos de toma. Suele pasar con capturas de pantalla y con imágenes que pasaron por WhatsApp o redes sociales, que borran el EXIF.",
  privacy: "Privacidad",
  found: "Trae datos que te identifican:",
  gps: "Ubicación GPS",
  map: "Ver en el mapa",
  serial: "N.º de serie de la cámara",
  lensSerial: "N.º de serie del lente",
  owner: "Dueño de la cámara",
  artist: "Autor",
  copyright: "Copyright",
  clean: "No trae ubicación ni datos que te identifiquen.",
  stripped: "La imagen que descargas no incluye ninguno de estos datos.",
  frame: "Marco",
  light: "Claro",
  dark: "Oscuro",
  none: "Sin marco",
  showDate: "Fecha en el marco",
  download: "Descargar JPG",
  exporting: "Exportando…",
  downloadNote: "Se descarga sin metadatos.",
  notImage: "Eso no es una imagen. Prueba con un JPG.",
  cantOpen: "Tu navegador no puede abrir este formato. Prueba con un JPG.",
  exportFailed: "No se pudo exportar. Prueba con una foto más pequeña.",
  preview: "Vista previa del marco",
  switchTo: "Switch to English",
  by: "Hecho por",
};

const en: typeof es = {
  dropTitle: "Drop a photo",
  dropBody: "Reads the camera, lens and exposure, warns you if it carries your location, and exports a framed copy without metadata.",
  choose: "Choose photo",
  formats: "JPG, PNG or WebP. HEIC on Safari only.",
  local: "Everything happens in your browser: the photo is never uploaded.",
  another: "Another photo",
  shot: "Shot data",
  camera: "Camera",
  lens: "Lens",
  focal: "Focal length",
  equivalent: "eq.",
  aperture: "Aperture",
  shutter: "Shutter",
  iso: "ISO",
  ev: "Exposure comp.",
  date: "Date",
  software: "Software",
  size: "Size",
  noExif:
    "This photo has no shot data. That's common with screenshots and with images sent through WhatsApp or social networks, which strip EXIF.",
  privacy: "Privacy",
  found: "It carries data that identifies you:",
  gps: "GPS location",
  map: "View on map",
  serial: "Camera serial number",
  lensSerial: "Lens serial number",
  owner: "Camera owner",
  artist: "Artist",
  copyright: "Copyright",
  clean: "No location or identifying data found.",
  stripped: "The image you download includes none of this.",
  frame: "Frame",
  light: "Light",
  dark: "Dark",
  none: "No frame",
  showDate: "Date on frame",
  download: "Download JPG",
  exporting: "Exporting…",
  downloadNote: "Downloads without metadata.",
  notImage: "That's not an image. Try a JPG.",
  cantOpen: "Your browser can't open this format. Try a JPG.",
  exportFailed: "Export failed. Try a smaller photo.",
  preview: "Frame preview",
  switchTo: "Cambiar a español",
  by: "Made by",
};

export type Copy = typeof es;
export const COPY: Record<Locale, Copy> = { es, en };

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const LocaleContext = createContext<LocaleState>({ locale: "es", setLocale: () => {} });
export const useLocale = () => useContext(LocaleContext);
export const useT = () => COPY[useLocale().locale];

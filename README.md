# RIQE Exif Frame

Lee los datos de toma de una foto (cámara, lente, focal, apertura, velocidad, ISO), avisa si trae información que te identifica y exporta una versión con marco y **sin metadatos**. Todo corre en el navegador: la foto nunca se sube a un servidor.

## Qué hace

- **Datos de toma** leídos del EXIF con [exifr](https://github.com/MikeKovarik/exifr), en la notación de la cámara (`F2.8`, `1/250`, `ISO 100`). Los modelos Sony se muestran con su nombre comercial (`ILCE-6400` → `α6400`).
- **Privacidad:** detecta ubicación GPS, número de serie de cámara y lente, dueño, autor y copyright. El JPG exportado se genera desde un canvas, así que sale sin ninguno de esos datos.
- **Marco:** claro, oscuro o sin marco, con cámara y lente a la izquierda y exposición y fecha a la derecha. La vista previa usa el mismo dibujo que el export.
- **Export a resolución completa**, limitado a ~16 MP en navegadores que no permiten canvas más grandes (Safari en iOS).
- Soltar, elegir o pegar (⌘V) una foto. Español e inglés.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Canvas API · exifr

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
npm run lint
```

El build usa rutas relativas (`base: "./"`): `dist/` sirve igual en la raíz de un dominio (Vercel) o en un subdirectorio.

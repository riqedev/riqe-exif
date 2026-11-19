/** Une clases condicionales. Sin tailwind-merge: los componentes no pisan utilidades entre sí. */
export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

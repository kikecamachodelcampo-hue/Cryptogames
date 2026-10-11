// Manifiesto de la PWA: permite "instalar" la web en el móvil como si fuera una app.
// (Los iconos definitivos y el modo sin conexión llegarán en el paso 8.)
import type { MetadataRoute } from "next";
import { NOMBRE_JUEGO } from "shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NOMBRE_JUEGO} · Duelos 1 vs 1`,
    short_name: NOMBRE_JUEGO,
    description: "Duelos 1 vs 1 de minijuegos rápidos.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07070d",
    theme_color: "#07070d",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}

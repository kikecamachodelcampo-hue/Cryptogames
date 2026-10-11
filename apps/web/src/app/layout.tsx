// Plantilla común a todas las páginas: idioma, tipografías y metadatos.
import type { Metadata, Viewport } from "next";
import { Bungee, Geist } from "next/font/google";
import { NOMBRE_JUEGO } from "shared";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Tipografía gruesa estilo "arcade" para los títulos.
const bungee = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${NOMBRE_JUEGO} · Duelos 1 vs 1`,
  description: "Duelos 1 vs 1 de minijuegos rápidos. Reflejos, ELO y gloria.",
  appleWebApp: { capable: true, title: NOMBRE_JUEGO, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
  // Evita el zoom accidental al pulsar rápido en el móvil durante los juegos.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${bungee.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}

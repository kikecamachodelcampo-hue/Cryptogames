// Página /jugar/duelo-oeste/bot → Duelo del oeste contra el bot.
import type { Metadata } from "next";
import { PartidaDuelo } from "@/juegos/duelo-oeste/PartidaDuelo";

export const metadata: Metadata = { title: "Duelo del oeste vs bot" };

export default function DueloContraBot() {
  return <PartidaDuelo contraBot />;
}

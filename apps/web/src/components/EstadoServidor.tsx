"use client";
// Piloto que indica si la web está conectada al servidor de juego.
// "use client" significa que este componente se ejecuta en el navegador
// (necesita abrir una conexión WebSocket, cosa que solo puede hacer el navegador).
import { useEffect, useState } from "react";
import { Client } from "@colyseus/sdk";
import { urlServidor } from "@/lib/servidor";

type Estado =
  | { tipo: "conectando" }
  | { tipo: "online"; jugadores: number }
  | { tipo: "offline" };

export function EstadoServidor() {
  const [estado, setEstado] = useState<Estado>({ tipo: "conectando" });

  useEffect(() => {
    let cancelado = false;
    const cliente = new Client(urlServidor());
    // Entramos en la sala "vestibulo", que solo cuenta cuánta gente hay conectada.
    const sala = cliente.joinOrCreate("vestibulo");

    sala
      .then((room) => {
        if (cancelado) return void room.leave();
        room.onStateChange((s: { jugadoresOnline: number }) =>
          setEstado({ tipo: "online", jugadores: s.jugadoresOnline }),
        );
        room.onLeave(() => setEstado({ tipo: "offline" }));
      })
      .catch(() => !cancelado && setEstado({ tipo: "offline" }));

    // Al salir de la página cerramos la conexión.
    return () => {
      cancelado = true;
      sala.then((room) => room.leave()).catch(() => {});
    };
  }, []);

  const estilos = {
    conectando: "border-amarillo/40 text-amarillo",
    online: "border-pump/40 text-pump",
    offline: "border-dump/40 text-dump",
  }[estado.tipo];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border bg-black/40 px-3 py-1 text-xs font-bold ${estilos}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {estado.tipo === "conectando" && "Conectando…"}
      {estado.tipo === "online" && `Servidor online · ${estado.jugadores} conectad${estado.jugadores === 1 ? "o" : "os"}`}
      {estado.tipo === "offline" && "Servidor offline (¿lo has arrancado?)"}
    </span>
  );
}

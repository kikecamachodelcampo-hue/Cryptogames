"use client";
// Partida del Duelo del oeste.
//
// - Se conecta a una sala "duelo_oeste" del servidor.
// - Contesta a los pings del servidor (así mide tu latencia).
// - Cuando pulsas, envía "disparar". Nada más: el servidor decide todo.
// - Pinta el marcador con React y el escenario con Phaser (EscenaDuelo).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Room } from "@colyseus/sdk";
import { DUELO, MSG, type FaseDuelo, type MotivoRonda } from "shared";
import { crearCliente } from "@/juegos/conexion";
import type { EscenaDuelo } from "./EscenaDuelo";

interface VistaJugador {
  nombre: string;
  esBot: boolean;
  puntos: number;
  reaccionMs: number;
  adelantado: boolean;
}

/** Copia "plana" del estado del servidor, vista desde mi lado. */
interface Vista {
  fase: FaseDuelo;
  ronda: number;
  yo?: VistaJugador;
  rival?: VistaJugador;
  ganeRonda: boolean | null; // null = ronda nula o sin decidir
  motivoRonda: MotivoRonda | "";
  gane: boolean;
  abandono: boolean;
}

// Tipo mínimo del estado que nos envía el servidor.
interface EstadoServidor {
  fase: string;
  ronda: number;
  jugadores: Map<string, VistaJugador>;
  ganadorRonda: string;
  motivoRonda: string;
  ganador: string;
  abandono: boolean;
}

function aVista(s: EstadoServidor, miId: string): Vista {
  let yo: VistaJugador | undefined;
  let rival: VistaJugador | undefined;
  s.jugadores.forEach((j, id) => {
    const copia = { nombre: j.nombre, esBot: j.esBot, puntos: j.puntos, reaccionMs: j.reaccionMs, adelantado: j.adelantado };
    if (id === miId) yo = copia;
    else rival = copia;
  });
  return {
    fase: s.fase as FaseDuelo,
    ronda: s.ronda,
    yo,
    rival,
    ganeRonda: s.ganadorRonda ? s.ganadorRonda === miId : null,
    motivoRonda: s.motivoRonda as MotivoRonda | "",
    gane: s.ganador === miId,
    abandono: s.abandono,
  };
}

/** Envoltorio: cambiar la "key" crea una partida nueva desde cero (botón Revancha). */
export function PartidaDuelo({ contraBot }: { contraBot: boolean }) {
  const [numPartida, setNumPartida] = useState(0);
  return <Partida key={numPartida} contraBot={contraBot} onOtraVez={() => setNumPartida((n) => n + 1)} />;
}

function Partida({ contraBot, onOtraVez }: { contraBot: boolean; onOtraVez: () => void }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const salaRef = useRef<Room | null>(null);
  const escenaRef = useRef<EscenaDuelo | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) Conexión con el servidor.
  useEffect(() => {
    let cancelado = false;
    let terminada = false;
    const union = crearCliente().create("duelo_oeste", { contraBot });

    union
      .then((sala) => {
        if (cancelado) return void sala.leave();
        salaRef.current = sala;
        // Contestamos al instante a cada ping para que el servidor mida la latencia.
        sala.onMessage(MSG.PING, (datos) => sala.send(MSG.PONG, datos));
        // La señal llega como mensaje directo: la mostramos sin esperar a nada más.
        sala.onMessage(MSG.SENAL, () => escenaRef.current?.mostrarSenal());
        sala.onStateChange((s: EstadoServidor) => {
          terminada = s.fase === "fin";
          setVista(aVista(s, sala.sessionId));
        });
        sala.onLeave(() => {
          if (!cancelado && !terminada) setError("Se ha perdido la conexión con el servidor.");
        });
      })
      .catch(() => !cancelado && setError("No se pudo conectar con el servidor. ¿Está arrancado?"));

    return () => {
      cancelado = true;
      salaRef.current = null;
      union.then((sala) => sala.leave()).catch(() => {});
    };
  }, [contraBot]);

  // 2) Escenario de Phaser (se carga solo en el navegador).
  useEffect(() => {
    let juego: import("phaser").Game | null = null;
    let cancelado = false;

    (async () => {
      await document.fonts.ready; // que la tipografía esté lista antes de dibujar textos
      const [{ default: Phaser }, { EscenaDuelo }] = await Promise.all([import("phaser"), import("./EscenaDuelo")]);
      if (cancelado || !contenedorRef.current) return;
      const fuente = getComputedStyle(document.body).getPropertyValue("--font-bungee").trim() || "sans-serif";

      juego = new Phaser.Game({
        type: Phaser.AUTO,
        parent: contenedorRef.current,
        transparent: true,
        scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
      });
      const escena = new EscenaDuelo();
      juego.scene.add("duelo-oeste", escena, true, {
        fuente,
        rivalEsBot: contraBot,
        onDisparo: () => salaRef.current?.send(MSG.DISPARAR),
      });
      escenaRef.current = escena;
    })();

    return () => {
      cancelado = true;
      escenaRef.current = null;
      juego?.destroy(true);
    };
  }, [contraBot]);

  // 3) Cada cambio de fase se refleja en el escenario.
  const fase = vista?.fase;
  const ganeRonda = vista?.ganeRonda ?? null;
  useEffect(() => {
    if (!fase) return;
    escenaRef.current?.mostrarFase(fase);
    if (fase === "resultado_ronda" || fase === "fin") escenaRef.current?.mostrarResultadoRonda(ganeRonda);
  }, [fase, ganeRonda]);

  return (
    <div className="flex h-dvh flex-col select-none">
      <Marcador vista={vista} />
      <div className="relative flex-1 touch-none overflow-hidden">
        <div ref={contenedorRef} className="absolute inset-0" />
        {!vista && !error && <Aviso>Conectando con el servidor…</Aviso>}
        {error && (
          <Aviso>
            <p>{error}</p>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-pump px-5 py-3 font-bold text-fondo">
              Volver al inicio
            </Link>
          </Aviso>
        )}
        {vista && (vista.fase === "resultado_ronda" || vista.fase === "fin") && <ResultadoRonda vista={vista} />}
        {vista?.fase === "fin" && <FinPartida vista={vista} contraBot={contraBot} onOtraVez={onOtraVez} />}
      </div>
      <p className="bg-panel py-2 text-center text-xs text-suave">
        Toca la pantalla o pulsa <kbd className="rounded bg-fondo px-1">ESPACIO</kbd> para disparar
      </p>
    </div>
  );
}

// ---------- Piezas de la interfaz ----------

function Marcador({ vista }: { vista: Vista | null }) {
  return (
    <header className="flex items-center justify-between gap-2 bg-panel px-3 py-2">
      <FichaJugador jugador={vista?.yo} etiqueta="Tú" />
      <div className="text-center">
        <Link href="/" className="font-titulo text-xs text-pump">
          ← SALIR
        </Link>
        <div className="font-titulo text-sm">RONDA {vista?.ronda || "–"}</div>
      </div>
      <FichaJugador jugador={vista?.rival} etiqueta="Rival" derecha />
    </header>
  );
}

function FichaJugador({ jugador, etiqueta, derecha }: { jugador?: VistaJugador; etiqueta: string; derecha?: boolean }) {
  const puntos = Array.from({ length: DUELO.RONDAS_PARA_GANAR }, (_, i) => i < (jugador?.puntos ?? 0));
  return (
    <div className={`flex min-w-0 flex-1 flex-col ${derecha ? "items-end text-right" : ""}`}>
      <div className="flex max-w-full items-center gap-1 truncate text-sm font-bold">
        {jugador?.esBot && <span className="rounded bg-morado px-1 text-[10px] font-black">BOT</span>}
        <span className="truncate">{jugador ? `${etiqueta} · ${jugador.nombre}` : "…"}</span>
      </div>
      <div className="mt-1 flex gap-1" aria-label={`${jugador?.puntos ?? 0} rondas ganadas`}>
        {puntos.map((ganado, i) => (
          <span key={i} className={`h-3 w-3 rounded-full ${ganado ? "bg-pump shadow-[0_0_8px] shadow-pump" : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}

function textoTiempo(j?: VistaJugador) {
  if (!j) return "";
  if (j.adelantado) return "se adelantó";
  return j.reaccionMs >= 0 ? `${j.reaccionMs} ms` : "—";
}

function ResultadoRonda({ vista }: { vista: Vista }) {
  const { yo, rival, ganeRonda, motivoRonda } = vista;
  let titulo: string;
  if (motivoRonda === "nulo") titulo = "Nadie disparó a tiempo. Se repite 🔁";
  else if (motivoRonda === "adelantado") titulo = ganeRonda ? "¡Tu rival se adelantó! 😹 Ronda para ti" : "¡Te has adelantado! 💀";
  else titulo = ganeRonda ? "¡Ronda para ti! ⚡" : "Tu rival fue más rápido 🐢";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
      <div className={`rounded-2xl border bg-fondo/85 px-5 py-3 text-center ${ganeRonda ? "border-pump" : "border-dump"}`}>
        <p className={`font-titulo text-lg ${ganeRonda ? "text-pump" : ganeRonda === false ? "text-dump" : ""}`}>{titulo}</p>
        <p className="mt-1 text-sm text-suave">
          Tú: <b className="text-texto">{textoTiempo(yo)}</b> · Rival: <b className="text-texto">{textoTiempo(rival)}</b>
        </p>
      </div>
    </div>
  );
}

function FinPartida({ vista, contraBot, onOtraVez }: { vista: Vista; contraBot: boolean; onOtraVez: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-fondo/80 px-4 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-3xl border-2 bg-panel p-6 text-center ${vista.gane ? "border-pump" : "border-dump"}`}>
        <div className="text-6xl">{vista.gane ? "🚀" : "💀"}</div>
        <h2 className={`font-titulo mt-2 text-4xl ${vista.gane ? "text-pump neon-pump" : "text-dump"}`}>
          {vista.gane ? "¡VICTORIA!" : "REKT"}
        </h2>
        <p className="mt-1 text-suave">{vista.gane ? "WAGMI. Reflejos de ballena 🐋" : "Hoy no era tu día, ser."}</p>
        <p className="font-titulo mt-4 text-3xl">
          {vista.yo?.puntos ?? 0} – {vista.rival?.puntos ?? 0}
        </p>
        {vista.abandono && <p className="mt-2 text-sm text-amarillo">Tu rival abandonó la partida.</p>}
        {contraBot && (
          <p className="mt-3 rounded-lg bg-morado/20 px-3 py-2 text-xs text-suave">
            🤖 Partida contra un bot: no cuenta para tu ELO.
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={onOtraVez} className="rounded-xl bg-pump py-3 font-bold text-fondo active:scale-95">
            🔁 Revancha
          </button>
          <Link href="/" className="rounded-xl border border-white/20 py-3 font-bold">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-fondo/70 px-6 text-center">
      {children}
    </div>
  );
}

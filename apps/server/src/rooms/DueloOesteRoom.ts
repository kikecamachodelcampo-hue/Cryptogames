// Sala del Duelo del oeste: aquí vive el árbitro.
//
// El navegador SOLO envía "disparar". El servidor decide cuándo sale la señal,
// mide cuándo llega cada disparo, descuenta la latencia de cada jugador y decide
// quién gana. Nada de eso se puede trucar desde el navegador.
import { Room, type Client } from "colyseus";
import type { Delayed } from "@colyseus/timer";
import { DUELO, MSG, type FaseDuelo, type MotivoRonda, type OpcionesDuelo } from "shared";
import {
  BOT,
  compensacionLatencia,
  esAnticipacion,
  ganadorPorReaccion,
  limiteEsperaRival,
  retrasoSenalAleatorio,
  tiempoReaccion,
} from "../logica/dueloOeste.js";
import { DueloOesteState, JugadorDuelo } from "./schema/DueloOesteState.js";

const ID_BOT = "bot";
const PINGS_GUARDADOS = 10;

/** Datos internos de cada jugador que NO se envían a los navegadores. */
interface DatosPrivados {
  pings: number[]; // últimos pings medidos (ms)
  pingsPendientes: Map<number, number>; // id de ping → momento de envío
}

/** Reloj de alta precisión en milisegundos. */
const ahora = () => performance.now();

export class DueloOesteRoom extends Room<{ state: DueloOesteState }> {
  maxClients = 2;
  maxMessagesPerSecond = 30; // un cliente que inunde de mensajes es expulsado
  state = new DueloOesteState();

  private privados = new Map<string, DatosPrivados>();
  /** Reacción de los disparos válidos de esta ronda (ya compensada). */
  private disparos = new Map<string, number>();
  private momentoSenal = 0;
  private temporizadores: Delayed[] = [];
  private siguientePingId = 0;

  messages = {
    [MSG.DISPARAR]: (client: Client) => this.recibirDisparo(client.sessionId, ahora()),
    [MSG.PONG]: (client: Client, datos: { id?: unknown }) => this.recibirPong(client.sessionId, datos?.id),
  };

  onCreate(opciones: OpcionesDuelo) {
    this.state.contraBot = Boolean(opciones?.contraBot);
    if (this.state.contraBot) this.maxClients = 1;
    // Medimos el ping de todos los jugadores cada segundo, durante toda la partida.
    this.clock.setInterval(() => this.enviarPings(), DUELO.INTERVALO_PING_MS);
  }

  onJoin(client: Client, opciones: OpcionesDuelo) {
    const nombre = limpiarNombre(opciones?.nombre) || `Forastero ${client.sessionId.slice(0, 4)}`;
    this.state.jugadores.set(client.sessionId, new JugadorDuelo({ nombre }));
    this.privados.set(client.sessionId, { pings: [], pingsPendientes: new Map() });
    this.enviarPings();

    if (this.state.contraBot) {
      this.state.jugadores.set(ID_BOT, new JugadorDuelo({ nombre: "Satoshi Bot", esBot: true }));
    }
    if (this.state.jugadores.size === 2) {
      this.lock(); // nadie más puede entrar
      this.iniciarRonda();
    }
  }

  onLeave(client: Client) {
    this.privados.delete(client.sessionId);
    // Si alguien se va a mitad de partida, gana el que se queda.
    if (this.state.fase !== "fin" && this.state.fase !== "esperando_rival") {
      const otro = this.idRival(client.sessionId);
      if (otro && otro !== ID_BOT) {
        this.cancelarTemporizadores();
        this.state.abandono = true;
        this.state.ganador = otro;
        this.cambiarFase("fin");
      }
    }
  }

  // ---------- Rondas ----------

  private iniciarRonda() {
    this.cancelarTemporizadores();
    this.disparos.clear();
    this.state.ronda += 1;
    this.state.ganadorRonda = "";
    this.state.motivoRonda = "";
    this.state.jugadores.forEach((j) => {
      j.reaccionMs = -1;
      j.adelantado = false;
    });

    this.cambiarFase("preparados");
    this.programar(() => {
      this.cambiarFase("esperando_senal");
      const retraso = retrasoSenalAleatorio();
      this.programar(() => this.emitirSenal(), retraso);

      // El bot, a veces, se pone nervioso y dispara antes de tiempo.
      if (this.state.contraBot && Math.random() < BOT.PROB_ADELANTARSE) {
        this.programar(() => this.recibirDisparo(ID_BOT, ahora()), Math.random() * retraso);
      }
    }, DUELO.PREPARADOS_MS);
  }

  private emitirSenal() {
    this.momentoSenal = ahora();
    // Se envía como mensaje directo (sale al instante), no esperando a la
    // siguiente sincronización del estado.
    this.broadcast(MSG.SENAL);
    this.cambiarFase("senal");

    if (this.state.contraBot) {
      const reaccionBot = BOT.reaccion();
      this.programar(() => this.recibirDisparo(ID_BOT, this.momentoSenal + reaccionBot), reaccionBot);
    }
    // Si nadie dispara a tiempo, la ronda se repite.
    this.programar(() => this.resolverPorTiempos(), DUELO.TIEMPO_MAX_DISPARO_MS);
  }

  private recibirDisparo(id: string, llegada: number) {
    const jugador = this.state.jugadores.get(id);
    if (!jugador) return;
    const fase = this.state.fase as FaseDuelo;

    // Disparar antes de la señal = pierdes la ronda.
    if (fase === "preparados" || fase === "esperando_senal") {
      jugador.adelantado = true;
      this.terminarRonda(this.idRival(id), "adelantado");
      return;
    }
    if (fase !== "senal" || this.disparos.has(id)) return; // fuera de tiempo o repetido

    const compensacion = id === ID_BOT ? 0 : this.compensacionDe(id);
    const reaccion = tiempoReaccion(llegada, this.momentoSenal, compensacion);

    // Más rápido de lo humanamente posible: tuvo que pulsar antes de ver la señal.
    if (esAnticipacion(reaccion)) {
      jugador.adelantado = true;
      this.terminarRonda(this.idRival(id), "adelantado");
      return;
    }

    this.disparos.set(id, reaccion);
    jugador.reaccionMs = Math.round(reaccion);

    if (this.disparos.size === this.state.jugadores.size) {
      this.resolverPorTiempos();
    } else if (this.disparos.size === 1) {
      // Esperamos al rival solo mientras todavía pueda ganar (según su latencia).
      const rival = this.idRival(id)!;
      const compRival = rival === ID_BOT ? 0 : this.compensacionDe(rival);
      const limite = limiteEsperaRival(this.momentoSenal, reaccion, compRival);
      this.programar(() => this.resolverPorTiempos(), Math.max(0, limite - ahora()) + 5);
    }
  }

  private resolverPorTiempos() {
    if (this.state.fase !== "senal") return;
    const ganador = ganadorPorReaccion(this.disparos);
    this.terminarRonda(ganador, ganador ? "mas_rapido" : "nulo");
  }

  private terminarRonda(ganador: string | null, motivo: MotivoRonda) {
    this.cancelarTemporizadores();
    this.state.ganadorRonda = ganador ?? "";
    this.state.motivoRonda = motivo;

    const jugadorGanador = ganador ? this.state.jugadores.get(ganador) : undefined;
    if (jugadorGanador) jugadorGanador.puntos += 1;

    if (jugadorGanador && jugadorGanador.puntos >= DUELO.RONDAS_PARA_GANAR) {
      this.state.ganador = ganador!;
      this.cambiarFase("fin");
      return;
    }
    this.cambiarFase("resultado_ronda");
    this.programar(() => this.iniciarRonda(), DUELO.RESULTADO_RONDA_MS);
  }

  // ---------- Latencia ----------

  private enviarPings() {
    for (const client of this.clients) {
      const datos = this.privados.get(client.sessionId);
      if (!datos) continue;
      const id = ++this.siguientePingId;
      datos.pingsPendientes.set(id, ahora());
      client.send(MSG.PING, { id });
    }
  }

  private recibirPong(sessionId: string, id: unknown) {
    const datos = this.privados.get(sessionId);
    if (!datos || typeof id !== "number") return;
    const enviado = datos.pingsPendientes.get(id);
    if (enviado === undefined) return; // pong falso o repetido: se ignora
    datos.pingsPendientes.delete(id);
    datos.pings.push(ahora() - enviado);
    if (datos.pings.length > PINGS_GUARDADOS) datos.pings.shift();
  }

  private compensacionDe(sessionId: string): number {
    return compensacionLatencia(this.privados.get(sessionId)?.pings ?? []);
  }

  // ---------- Utilidades ----------

  private idRival(id: string): string | null {
    for (const otro of this.state.jugadores.keys()) if (otro !== id) return otro;
    return null;
  }

  private cambiarFase(fase: FaseDuelo) {
    this.state.fase = fase;
  }

  private programar(fn: () => void, ms: number) {
    this.temporizadores.push(this.clock.setTimeout(fn, ms));
  }

  private cancelarTemporizadores() {
    this.temporizadores.forEach((t) => t.clear());
    this.temporizadores = [];
  }
}

/** Nombre seguro: sin espacios sobrantes y como mucho 20 caracteres. */
function limpiarNombre(nombre: unknown): string {
  return typeof nombre === "string" ? nombre.trim().slice(0, 20) : "";
}

// Estado de una partida del Duelo del oeste. Todo lo que hay aquí se envía
// automáticamente a los navegadores. OJO: nunca guardar aquí el momento de la
// señal antes de que ocurra, o un tramposo podría leerlo.
import { schema, t, type SchemaType } from "@colyseus/schema";

export const JugadorDuelo = schema(
  {
    nombre: t.string().default(""),
    esBot: t.boolean().default(false),
    /** Rondas ganadas. */
    puntos: t.uint8().default(0),
    /** Reacción en la última ronda (ms, ya compensada). -1 = no disparó. */
    reaccionMs: t.int16().default(-1),
    /** Se adelantó a la señal en la última ronda. */
    adelantado: t.boolean().default(false),
  },
  "JugadorDuelo",
);
export type JugadorDuelo = SchemaType<typeof JugadorDuelo>;

export const DueloOesteState = schema(
  {
    /** Ver FaseDuelo en packages/shared. */
    fase: t.string().default("esperando_rival"),
    ronda: t.uint8().default(0),
    contraBot: t.boolean().default(false),
    /** Jugadores por id de sesión. */
    jugadores: t.map(JugadorDuelo),
    /** Ganador de la última ronda ("" si fue nula). */
    ganadorRonda: t.string().default(""),
    /** Ver MotivoRonda en packages/shared. */
    motivoRonda: t.string().default(""),
    /** Ganador de la partida ("" mientras se juega). */
    ganador: t.string().default(""),
    /** true si la partida terminó porque alguien se fue. */
    abandono: t.boolean().default(false),
  },
  "DueloOesteState",
);
export type DueloOesteState = SchemaType<typeof DueloOesteState>;

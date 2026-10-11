// Reglas y mensajes del "Duelo del oeste", compartidos por la web y el servidor.

export const DUELO = {
  /** Rondas que hay que ganar para llevarse la partida (al mejor de 5 → 3). */
  RONDAS_PARA_GANAR: 3,
  /** La señal llega entre 2 y 6 segundos después de "¡Preparados!". */
  SENAL_MIN_MS: 2000,
  SENAL_MAX_MS: 6000,
  /** Tiempo que se muestra "¡Preparados!" antes de empezar a esperar la señal. */
  PREPARADOS_MS: 1500,
  /** Tiempo para disparar tras la señal; si nadie dispara, la ronda se repite. */
  TIEMPO_MAX_DISPARO_MS: 2500,
  /** Tiempo que se enseña el resultado de cada ronda antes de la siguiente. */
  RESULTADO_RONDA_MS: 2500,
  /** Ningún humano reacciona en menos de esto: si pasa, se cuenta como adelantarse. */
  REACCION_MIN_HUMANA_MS: 100,
  /** Máximo de latencia que se descuenta a un jugador (evita trampas provocando lag). */
  COMPENSACION_MAX_MS: 150,
  /** Cada cuánto mide el servidor el ping de cada jugador. */
  INTERVALO_PING_MS: 1000,
} as const;

/** Fases de una partida. El servidor es quien cambia de una a otra. */
export type FaseDuelo =
  | "esperando_rival" // falta un jugador
  | "preparados" // "¡Preparados!"
  | "esperando_senal" // tensión: hay que esperar sin pulsar
  | "senal" // ¡FUEGO! ya se puede disparar
  | "resultado_ronda" // se muestra quién ganó la ronda
  | "fin"; // partida terminada

/** Cómo se decidió una ronda. */
export type MotivoRonda =
  | "mas_rapido" // ganó el que reaccionó antes
  | "adelantado" // el rival se adelantó a la señal
  | "nulo"; // nadie disparó a tiempo (o empate exacto): se repite

/** Opciones con las que el navegador pide entrar en una partida. */
export interface OpcionesDuelo {
  contraBot?: boolean;
  nombre?: string;
}

/** Nombres de los mensajes que viajan entre navegador y servidor. */
export const MSG = {
  /** navegador → servidor: "he disparado" (no lleva datos: el servidor mide el tiempo). */
  DISPARAR: "disparar",
  /** servidor → navegador: "¡FUEGO!". Se envía al instante, sin esperar al estado. */
  SENAL: "senal",
  /** servidor → navegador → servidor: medición de latencia. */
  PING: "ping",
  PONG: "pong",
} as const;

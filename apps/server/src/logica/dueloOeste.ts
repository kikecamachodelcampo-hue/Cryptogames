// Cálculos del Duelo del oeste, separados de la sala para poder probarlos con tests.
import { DUELO } from "shared";

/** Mediana de una lista de números (el valor del medio una vez ordenados). */
export function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2;
}

/**
 * Cuánto tiempo se descuenta a un jugador por su conexión.
 *
 * El servidor mide el "ping" (ida y vuelta) varias veces. La señal tarda en
 * llegarle aproximadamente la mitad (solo la ida), así que descontamos eso.
 * Usamos la mediana para que un ping suelto muy alto no influya, y ponemos un
 * tope: así nadie gana ventaja ralentizando su conexión a propósito.
 */
export function compensacionLatencia(pingsMs: number[]): number {
  const ida = mediana(pingsMs) / 2;
  return Math.min(Math.max(ida, 0), DUELO.COMPENSACION_MAX_MS);
}

/** Tiempo de reacción "justo" de un disparo, ya descontada la latencia. */
export function tiempoReaccion(llegadaMs: number, senalMs: number, compensacionMs: number): number {
  return llegadaMs - senalMs - compensacionMs;
}

/** ¿Es un disparo demasiado rápido para ser humano? Entonces cuenta como adelantarse. */
export function esAnticipacion(reaccionMs: number): boolean {
  return reaccionMs < DUELO.REACCION_MIN_HUMANA_MS;
}

/**
 * Elige al ganador de una ronda entre los disparos válidos (tras la señal).
 * Devuelve null si nadie disparó o si hay empate exacto (la ronda se repite).
 */
export function ganadorPorReaccion(disparos: Map<string, number>): string | null {
  let mejor: string | null = null;
  let mejorTiempo = Infinity;
  let empate = false;
  for (const [id, reaccion] of disparos) {
    if (reaccion < mejorTiempo) {
      mejor = id;
      mejorTiempo = reaccion;
      empate = false;
    } else if (reaccion === mejorTiempo) {
      empate = true;
    }
  }
  return empate ? null : mejor;
}

/**
 * Hasta cuándo merece la pena esperar el disparo de un rival que aún no ha disparado.
 * El rival solo puede ganar si su reacción (llegada − señal − su compensación) es menor
 * que la del primero, es decir, si su disparo llega antes de: señal + reacción + su compensación.
 */
export function limiteEsperaRival(senalMs: number, reaccionPrimeroMs: number, compensacionRivalMs: number): number {
  return senalMs + reaccionPrimeroMs + compensacionRivalMs;
}

/** Tiempo aleatorio (2–6 s) hasta la señal. */
export function retrasoSenalAleatorio(azar: () => number = Math.random): number {
  return DUELO.SENAL_MIN_MS + azar() * (DUELO.SENAL_MAX_MS - DUELO.SENAL_MIN_MS);
}

/** Comportamiento del bot: reacción humana creíble y, a veces, se adelanta. */
export const BOT = {
  REACCION_MIN_MS: 250,
  REACCION_MAX_MS: 450,
  PROB_ADELANTARSE: 0.06,
  reaccion(azar: () => number = Math.random): number {
    return BOT.REACCION_MIN_MS + azar() * (BOT.REACCION_MAX_MS - BOT.REACCION_MIN_MS);
  },
};

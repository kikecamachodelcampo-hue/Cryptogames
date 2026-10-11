// Código compartido entre la web (apps/web) y el servidor (apps/server).
// Todo lo que pongamos aquí lo usan los dos, así nunca se desincronizan.

/** Puerto en el que escucha el servidor de juego (Colyseus). */
export const PUERTO_SERVIDOR = 2567;

/** Nombre del proyecto que se muestra en la interfaz (provisional). */
export const NOMBRE_JUEGO = "DUELOS.MEME";

/** Juegos disponibles. El "id" es el nombre de la sala en el servidor. */
export const JUEGOS = [
  {
    id: "duelo_oeste",
    nombre: "Duelo del oeste",
    emoji: "🤠",
    descripcion: "Espera la señal y dispara antes que tu rival. Al mejor de 5.",
  },
  {
    id: "penaltis",
    nombre: "Penaltis",
    emoji: "⚽",
    descripcion: "Tira o para. 5 tandas y muerte súbita si hay empate.",
  },
] as const;

export type IdJuego = (typeof JUEGOS)[number]["id"];

/** Respuesta de la ruta /salud del servidor (para comprobar que está vivo). */
export interface RespuestaSalud {
  ok: boolean;
  servidor: string;
  hora: number;
}

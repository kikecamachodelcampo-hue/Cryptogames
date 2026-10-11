// Dónde está el servidor de juego (Colyseus).
//
// Si existe la variable NEXT_PUBLIC_SERVIDOR_URL (en .env.local) se usa esa.
// Si no, se usa el mismo ordenador que sirve la web, en el puerto 2567.
// Así funciona tanto en http://localhost:3000 como desde el móvil en tu red
// (http://192.168.x.x:3000) sin tocar nada.
import { PUERTO_SERVIDOR } from "shared";

export function urlServidor(): string {
  if (process.env.NEXT_PUBLIC_SERVIDOR_URL) {
    return process.env.NEXT_PUBLIC_SERVIDOR_URL;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${PUERTO_SERVIDOR}`;
}

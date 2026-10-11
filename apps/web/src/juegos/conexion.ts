// Crea la conexión con el servidor de juego (Colyseus).
import { Client } from "@colyseus/sdk";
import { urlServidor } from "@/lib/servidor";

export function crearCliente() {
  return new Client(urlServidor());
}

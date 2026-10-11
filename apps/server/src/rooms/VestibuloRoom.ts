// Sala de prueba del paso 1: cada vez que alguien entra o sale,
// actualiza el contador de jugadores conectados.
import { Room, type Client } from "colyseus";
import { VestibuloState } from "./schema/VestibuloState.js";

export class VestibuloRoom extends Room<{ state: VestibuloState }> {
  maxClients = 1000;
  state = new VestibuloState();

  onJoin(client: Client) {
    this.state.jugadoresOnline = this.clients.length;
    console.log(`[vestibulo] entra ${client.sessionId} (${this.clients.length} online)`);
  }

  onLeave(client: Client) {
    this.state.jugadoresOnline = this.clients.length;
    console.log(`[vestibulo] sale ${client.sessionId} (${this.clients.length} online)`);
  }
}

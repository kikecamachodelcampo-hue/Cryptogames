// El "estado" de una sala es la información que el servidor comparte
// automáticamente con todos los jugadores conectados. Si el servidor cambia
// un valor, a todos los navegadores les llega el cambio solo.
import { schema, t, type SchemaType } from "@colyseus/schema";

export const VestibuloState = schema({
  jugadoresOnline: t.number().default(0),
});
export type VestibuloState = SchemaType<typeof VestibuloState>;

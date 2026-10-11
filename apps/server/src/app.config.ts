// Configuración del servidor: qué "salas" existen y qué rutas HTTP hay.
//
// Una SALA (room) es una partida o espacio compartido. Cada jugador que se conecta
// entra en una sala, y el servidor ejecuta allí toda la lógica.
import { defineServer, defineRoom, monitor } from "colyseus";
import type { RespuestaSalud } from "shared";
import { VestibuloRoom } from "./rooms/VestibuloRoom.js";
import { DueloOesteRoom } from "./rooms/DueloOesteRoom.js";

const server = defineServer({
  rooms: {
    // Sala que solo cuenta cuánta gente hay conectada (piloto de la portada).
    vestibulo: defineRoom(VestibuloRoom),
    // Duelo del oeste. Cada partida es una sala distinta.
    duelo_oeste: defineRoom(DueloOesteRoom),
  },

  express: (app) => {
    // Permite que la web (otro puerto, otro dominio) consulte estas rutas HTTP.
    app.use((_req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });

    // Ruta para comprobar que el servidor está vivo: http://localhost:2567/salud
    app.get("/salud", (_req, res) => {
      const respuesta: RespuestaSalud = {
        ok: true,
        servidor: "duelos-meme",
        hora: Date.now(),
      };
      res.json(respuesta);
    });

    // Panel de administración para ver las salas abiertas (solo en desarrollo):
    // http://localhost:2567/monitor
    if (process.env.NODE_ENV !== "production") {
      app.use("/monitor", monitor());
    }
  },
});

export default server;

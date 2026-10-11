// Punto de entrada del servidor de juego.
// "listen" arranca Colyseus (WebSockets para el juego) + Express (rutas HTTP normales)
// en el puerto 2567, o en el que indique la variable de entorno PORT.
import { listen } from "@colyseus/tools";
import { PUERTO_SERVIDOR } from "shared";
import app from "./app.config.js";

listen(app, Number(process.env.PORT) || PUERTO_SERVIDOR);

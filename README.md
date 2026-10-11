# DUELOS.MEME ⚡

Duelos 1 vs 1 de minijuegos rápidos (Duelo del oeste 🤠 y Penaltis ⚽) con estética memecoin.
Sin apuestas ni dinero real: solo gloria y ELO.

## Cómo ejecutarlo en tu ordenador

1. Instala **Node.js 22 o superior** (versión "LTS") desde https://nodejs.org
2. Descarga el proyecto:
   ```bash
   git clone https://github.com/kikecamachodelcampo-hue/Cryptogames.git
   cd Cryptogames
   ```
3. Instala las dependencias (solo la primera vez o cuando cambien):
   ```bash
   npm install
   ```
4. Arranca la web y el servidor a la vez:
   ```bash
   npm run dev
   ```
5. Abre http://localhost:3000 en el navegador.

Para pararlo, pulsa `Ctrl + C` en la terminal.

## Partes del proyecto
| Carpeta | Qué es |
|---|---|
| `apps/web` | La web (Next.js). Lo que ve el jugador. |
| `apps/server` | El servidor de juego (Colyseus). El árbitro: decide todos los resultados. |
| `packages/shared` | Código común a web y servidor. |

Más detalles técnicos y estado del proyecto en [CLAUDE.md](CLAUDE.md).

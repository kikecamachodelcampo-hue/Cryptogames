# CLAUDE.md — DUELOS.MEME

Repositorio: github.com/kikecamachodelcampo-hue/Cryptogames (nombre de la marca provisional: DUELOS.MEME).
Resumen vivo del proyecto: qué es, decisiones tomadas y estado actual.
**Mantener actualizado en cada paso.**

## Qué es
Web app (PWA) de duelos 1 vs 1 de minijuegos rápidos con estética crypto/memecoin.
Interfaz en español y diseñada primero para móvil. El usuario es principiante:
explicar cada paso, qué hace cada parte y cómo ejecutarlo.

## Stack
- **apps/web**: Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack). `cacheComponents` y
  `partialPrefetching` activos (los trae la plantilla). Antes de tocar Next, leer
  `node_modules/next/dist/docs/` (ver `apps/web/AGENTS.md`).
- **Juegos**: Phaser 4. Se carga con `import()` dinámico dentro de un `useEffect` (solo navegador).
  Phaser solo pinta y detecta pulsaciones; el marcador y los botones son React encima del canvas.
  Las skills de Phaser 4 están en `node_modules/phaser/skills/` (útiles: v3-to-v4-migration).
- **apps/server**: Colyseus 0.18 (`defineServer` / `defineRoom`, estado con `@colyseus/schema` v5
  usando `schema({...})` + `t.*`), Express para rutas HTTP. Se ejecuta con `tsx` (sin compilar).
- **packages/shared**: TypeScript común a web y servidor (se importa como `"shared"`;
  la web lo compila con `transpilePackages`).
- **Supabase** (pendiente, paso 4): auth (email + invitado anónimo), perfiles, partidas, ELO.
- Node >= 22. Monorepo con npm workspaces. `npm run dev` en la raíz arranca web (3000) + servidor (2567).

## Reglas del proyecto
- **Servidor autoritativo**: el cliente solo envía acciones; el servidor decide resultados, tiempos y ELO.
  Solo el servidor escribe resultados en la BD (clave service role; RLS impide que el cliente lo haga).
- **Duelo del oeste**: señal aleatoria 2–6 s, decidida y enviada por el servidor (nunca revelada antes).
  Reacción = llegada − envío de la señal − latencia de ida estimada (mediana de pings), compensación
  máxima ~150 ms. Pulsar antes de la señal = pierde la ronda; < ~100 ms tras la señal = adelantado. Al mejor de 5.
- **Penaltis**: elecciones secretas simultáneas (dirección+potencia vs. dirección del portero), las resuelve
  el servidor con su propio azar. 5 tandas + muerte súbita. Sin elección a tiempo → aleatoria.
- **ELO**: uno por juego, inicial 1000, K=32. Matchmaking con ventana ±100 que se amplía con el tiempo;
  a los 20 s sin rival se ofrece bot (marcado como BOT, no afecta al ELO).
- Reto a amigo por enlace `/reto/CODIGO`; revancha con un clic (nueva sala con los mismos jugadores).
- Login futuro con wallet Solana: dejar `wallet_address` (nullable) en perfiles; Supabase soporta Web3 auth.
- **Fuera de alcance**: apuestas, depósitos, pagos, dinero o crypto de cualquier tipo; tienda y cosméticos.

## Estructura
```
apps/web/src/app/          páginas (layout, portada, manifest PWA, globals.css con colores)
apps/web/src/components/   EstadoServidor (piloto de conexión), Ticker (cinta de frases)
apps/web/src/lib/          servidor.ts (URL del servidor de juego)
apps/web/src/juegos/       conexion.ts + un directorio por juego:
  duelo-oeste/PartidaDuelo.tsx   conexión a la sala, pings, marcador, resultado, revancha
  duelo-oeste/EscenaDuelo.ts     escena Phaser (desierto, vaqueros, "¡FUEGO!", input)
apps/web/src/app/jugar/duelo-oeste/bot/   página del duelo contra bot
apps/server/src/           index.ts (arranque), app.config.ts (salas + rutas HTTP)
apps/server/src/rooms/     salas de Colyseus: VestibuloRoom (contador), DueloOesteRoom (árbitro)
apps/server/src/logica/    cálculos puros testeables (latencia, reacción, ganador, bot)
apps/server/test/          tests con node:test (npm test -w server)
packages/shared/src/       constantes y tipos comunes (JUEGOS, DUELO, MSG, FaseDuelo…)
```

## Estado (plan por pasos)
- [x] **1. Esqueleto**: monorepo, portada con estética, servidor Colyseus con sala `vestibulo`
      (contador de conectados) y ruta `/salud`.
- [x] **2. Duelo del oeste contra bot**: sala `duelo_oeste` (opción `contraBot`), fases
      preparados → esperando_senal → senal → resultado_ronda → fin; señal como mensaje directo;
      pings del servidor cada 1 s (mediana de 10, compensación = ida, tope 150 ms); tras el primer
      disparo se espera al rival solo mientras aún pueda ganar; bot 250–450 ms y 6 % de adelantarse.
      Página `/jugar/duelo-oeste/bot` con revancha (crea sala nueva).
- [ ] 3. Duelo 1 vs 1 por código de sala + compensación de latencia.
- [ ] 4. Login Supabase (invitado + email) y perfiles; el servidor valida el JWT.
- [ ] 5. ELO, historial, perfil (V/D/racha) y ranking global.
- [ ] 6. Matchmaking por ELO, bot a los 20 s, enlace de reto y revancha.
- [ ] 7. Penaltis (bot y 1 vs 1).
- [ ] 8. PWA instalable (iconos, service worker), reconexión, pulido móvil.
- [ ] 9. (Opcional) despliegue: web en Vercel, servidor en Railway/Fly.io.

## Comandos
- `npm install` — instala todo (raíz).
- `npm run dev` — web en http://localhost:3000 y servidor en http://localhost:2567.
- `npm run lint -w web`, `npm run typecheck`, `npm run build`, `npm test` — comprobaciones.
- Panel de salas (desarrollo): http://localhost:2567/monitor

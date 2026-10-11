// Portada (la página "/"). De momento muestra los juegos que vienen
// y el estado de la conexión con el servidor.
import { JUEGOS, NOMBRE_JUEGO } from "shared";
import { EstadoServidor } from "@/components/EstadoServidor";
import { Ticker } from "@/components/Ticker";

export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4">
        <span className="font-titulo text-lg text-pump neon-pump">{NOMBRE_JUEGO}</span>
        <EstadoServidor />
      </header>

      <Ticker />

      <section className="mx-auto w-full max-w-3xl px-4 pt-10 pb-6 text-center">
        <h1 className="font-titulo text-4xl leading-tight sm:text-6xl">
          1 vs 1.
          <br />
          <span className="text-pump neon-pump">Solo reflejos.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-suave">
          Duelos rápidos contra rivales de tu nivel. Gana, sube tu ELO y presume en el ranking.
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-3xl gap-4 px-4 pb-10 sm:grid-cols-2">
        {JUEGOS.map((juego) => (
          <article
            key={juego.id}
            className="rounded-2xl border border-morado/40 bg-panel/80 p-5 shadow-[0_0_30px_-10px] shadow-morado"
          >
            <div className="text-5xl">{juego.emoji}</div>
            <h2 className="font-titulo mt-3 text-xl">{juego.nombre}</h2>
            <p className="mt-1 text-sm text-suave">{juego.descripcion}</p>
            <button
              disabled
              className="mt-4 w-full rounded-xl bg-pump/20 py-3 font-bold text-pump/60"
            >
              Próximamente 🔜
            </button>
          </article>
        ))}
      </section>

      <footer className="mt-auto px-4 py-6 text-center text-xs text-suave">
        Sin apuestas ni dinero real. Solo gloria (y ELO).
      </footer>
    </main>
  );
}

// Cinta de texto que se desplaza sin parar, al estilo de los tickers de precios.
const FRASES = [
  "GM ☀️",
  "WAGMI 🚀",
  "Si disparas antes de la señal: NGMI 💀",
  "HODL tu dedo ✋",
  "100x reflejos 📈",
  "Ser rekt es temporal, el ranking es para siempre 🏆",
  "Sin apuestas. Solo gloria ⚡",
];

export function Ticker() {
  // Repetimos la lista dos veces para que la animación enlace sin saltos.
  const items = [...FRASES, ...FRASES];
  return (
    <div className="overflow-hidden border-y border-pump/30 bg-pump/5 py-2">
      <div className="animate-ticker flex w-max gap-8 whitespace-nowrap text-sm font-bold text-pump">
        {items.map((frase, i) => (
          <span key={i}>{frase}</span>
        ))}
      </div>
    </div>
  );
}

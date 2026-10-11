// Tests de la lógica del duelo. Se ejecutan con: npm test -w server
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mediana,
  compensacionLatencia,
  tiempoReaccion,
  esAnticipacion,
  ganadorPorReaccion,
  limiteEsperaRival,
  retrasoSenalAleatorio,
} from "../src/logica/dueloOeste.js";

test("mediana ignora valores sueltos extremos", () => {
  assert.equal(mediana([]), 0);
  assert.equal(mediana([40, 50, 900]), 50);
  assert.equal(mediana([40, 60]), 50);
});

test("la compensación es la mitad del ping y tiene tope", () => {
  assert.equal(compensacionLatencia([]), 0);
  assert.equal(compensacionLatencia([80, 80, 80]), 40);
  // Alguien con un ping enorme (o falso) no recibe más de 150 ms de ventaja.
  assert.equal(compensacionLatencia([1000, 1200, 1100]), 150);
});

test("tiempo de reacción descuenta la latencia de ida", () => {
  assert.equal(tiempoReaccion(10_300, 10_000, 40), 260);
});

test("reacciones imposibles cuentan como adelantarse", () => {
  assert.equal(esAnticipacion(60), true);
  assert.equal(esAnticipacion(180), false);
});

test("gana el más rápido; empate exacto o sin disparos = ronda nula", () => {
  assert.equal(ganadorPorReaccion(new Map([["a", 300], ["b", 250]])), "b");
  assert.equal(ganadorPorReaccion(new Map([["a", 300]])), "a");
  assert.equal(ganadorPorReaccion(new Map([["a", 300], ["b", 300]])), null);
  assert.equal(ganadorPorReaccion(new Map()), null);
});

test("un jugador con más lag que llega después puede ganar si su reacción fue mejor", () => {
  // Señal en t=0. A (ping 20 → comp 10) llega en t=280 → reacción 270.
  // B (ping 200 → comp 100) llega en t=340 → reacción 240: B es más rápido de verdad.
  const reaccionA = tiempoReaccion(280, 0, 10);
  assert.equal(reaccionA, 270);
  assert.equal(limiteEsperaRival(0, reaccionA, 100), 370); // hay que esperar a B hasta t=370
  const reaccionB = tiempoReaccion(340, 0, 100);
  assert.equal(ganadorPorReaccion(new Map([["A", reaccionA], ["B", reaccionB]])), "B");
});

test("la señal llega entre 2 y 6 segundos", () => {
  assert.equal(retrasoSenalAleatorio(() => 0), 2000);
  assert.equal(retrasoSenalAleatorio(() => 0.999999) < 6000, true);
});

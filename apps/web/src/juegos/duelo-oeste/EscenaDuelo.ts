// Escena de Phaser del Duelo del oeste: dibuja el desierto, los dos vaqueros y
// los mensajes grandes ("¡PREPARADOS!", "¡FUEGO!"…), y detecta cuándo pulsas.
//
// IMPORTANTE: esta escena NO decide nada. Solo pinta lo que dice el servidor y
// le avisa (con onDisparo) cuando el jugador toca la pantalla o pulsa ESPACIO.
import Phaser from "phaser";
import type { FaseDuelo } from "shared";

const COLORES = {
  cielo: 0x1a0b2e,
  horizonte: 0x3b1460,
  suelo: 0x4a2a12,
  sol: 0xffd23f,
  pump: "#14f195",
  dump: "#ff3b6b",
  amarillo: "#ffd23f",
  blanco: "#ececf5",
};

export interface OpcionesEscena {
  fuente: string;
  rivalEsBot: boolean;
  onDisparo: () => void;
}

export class EscenaDuelo extends Phaser.Scene {
  private opciones!: OpcionesEscena;
  private cielo!: Phaser.GameObjects.Rectangle;
  private horizonte!: Phaser.GameObjects.Rectangle;
  private suelo!: Phaser.GameObjects.Rectangle;
  private sol!: Phaser.GameObjects.Arc;
  private cactus: Phaser.GameObjects.Text[] = [];
  private yo!: Phaser.GameObjects.Text;
  private rival!: Phaser.GameObjects.Text;
  private mensaje!: Phaser.GameObjects.Text;
  private flash!: Phaser.GameObjects.Rectangle;
  private pulso?: Phaser.Tweens.Tween;
  /** Fase que llegó antes de que la escena estuviera lista. */
  private fasePendiente?: FaseDuelo;

  constructor() {
    super("duelo-oeste");
  }

  init(opciones: OpcionesEscena) {
    this.opciones = opciones;
  }

  create() {
    this.cielo = this.add.rectangle(0, 0, 10, 10, COLORES.cielo).setOrigin(0);
    this.sol = this.add.circle(0, 0, 10, COLORES.sol); // sol poniéndose tras el horizonte
    this.horizonte = this.add.rectangle(0, 0, 10, 10, COLORES.horizonte).setOrigin(0);
    this.suelo = this.add.rectangle(0, 0, 10, 10, COLORES.suelo).setOrigin(0);
    this.cactus = [this.add.text(0, 0, "🌵").setOrigin(0.5, 1), this.add.text(0, 0, "🌵").setOrigin(0.5, 1)];

    this.yo = this.add.text(0, 0, "🤠").setOrigin(0.5, 1);
    this.rival = this.add.text(0, 0, this.opciones.rivalEsBot ? "🤖" : "🤠").setOrigin(0.5, 1);
    this.rival.setFlipX(true); // mirando hacia el otro vaquero

    this.mensaje = this.add
      .text(0, 0, "", { fontFamily: this.opciones.fuente, color: COLORES.blanco, align: "center" })
      .setOrigin(0.5);
    this.flash = this.add.rectangle(0, 0, 10, 10, 0xffffff).setOrigin(0).setAlpha(0);

    this.colocar();
    this.scale.on("resize", () => this.colocar());

    // Disparo: tocar/clicar en cualquier parte del juego, o la tecla ESPACIO.
    this.input.on("pointerdown", () => this.disparar());
    this.input.keyboard?.on("keydown-SPACE", () => this.disparar());

    if (this.fasePendiente) this.mostrarFase(this.fasePendiente);
  }

  /** Recoloca todo según el tamaño de la pantalla (móvil vertical u ordenador). */
  private colocar() {
    const { width: an, height: al } = this.scale;
    const lineaSuelo = al * 0.68;
    const tamVaquero = Math.min(an * 0.2, al * 0.16);

    this.cielo.setSize(an, al);
    this.horizonte.setPosition(0, lineaSuelo - al * 0.08).setSize(an, al * 0.08);
    this.sol.setPosition(an * 0.5, lineaSuelo - al * 0.08).setRadius(Math.min(an, al) * 0.1);
    this.suelo.setPosition(0, lineaSuelo).setSize(an, al - lineaSuelo);
    this.cactus[0].setPosition(an * 0.08, lineaSuelo + 4).setFontSize(tamVaquero * 0.6);
    this.cactus[1].setPosition(an * 0.93, lineaSuelo - 2).setFontSize(tamVaquero * 0.45);

    this.yo.setPosition(an * 0.22, lineaSuelo + tamVaquero * 0.35).setFontSize(tamVaquero);
    this.rival.setPosition(an * 0.78, lineaSuelo + tamVaquero * 0.35).setFontSize(tamVaquero);

    this.mensaje.setPosition(an / 2, al * 0.26).setFontSize(Math.min(an * 0.11, 64));
    this.mensaje.setWordWrapWidth(an * 0.9);
    this.flash.setSize(an, al);
  }

  private disparar() {
    this.opciones.onDisparo();
    // Respuesta visual inmediata (el resultado real lo decide el servidor).
    const bang = this.add
      .text(this.yo.x + this.yo.displayWidth * 0.45, this.yo.y - this.yo.displayHeight * 0.55, "💥")
      .setOrigin(0.5)
      .setFontSize(this.yo.displayHeight * 0.5);
    this.tweens.add({ targets: bang, alpha: 0, scale: 1.6, duration: 350, onComplete: () => bang.destroy() });
  }

  /** Muestra el mensaje grande de cada fase. Lo llama la página cuando cambia el estado. */
  mostrarFase(fase: FaseDuelo) {
    if (!this.mensaje) {
      this.fasePendiente = fase;
      return;
    }
    this.pulso?.stop();
    this.mensaje.setScale(1).setAlpha(1);

    switch (fase) {
      case "esperando_rival":
        this.texto("Esperando rival…", COLORES.blanco);
        break;
      case "preparados":
        this.texto("¡PREPARADOS!", COLORES.blanco);
        this.reiniciarVaqueros();
        break;
      case "esperando_senal":
        this.texto("No dispares…\nESPERA", COLORES.amarillo);
        this.pulso = this.tweens.add({ targets: this.mensaje, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
        break;
      case "senal":
        this.mostrarSenal();
        break;
      default:
        this.texto("", COLORES.blanco);
    }
  }

  /** ¡FUEGO! Se llama en cuanto llega el mensaje de la señal (lo más rápido posible). */
  mostrarSenal() {
    if (!this.mensaje || this.mensaje.text === "¡FUEGO!") return;
    this.pulso?.stop();
    this.texto("¡FUEGO!", COLORES.pump);
    this.mensaje.setAlpha(1).setScale(1.3);
    this.tweens.add({ targets: this.mensaje, scale: 1, duration: 150 });
    this.flash.setAlpha(0.85);
    this.tweens.add({ targets: this.flash, alpha: 0, duration: 250 });
  }

  /** Anima al perdedor de la ronda (cae al suelo). */
  mostrarResultadoRonda(ganoYo: boolean | null) {
    if (!this.yo || ganoYo === null) return;
    const perdedor = ganoYo ? this.rival : this.yo;
    const sentido = ganoYo ? 1 : -1;
    this.tweens.add({ targets: perdedor, angle: 90 * sentido, alpha: 0.6, duration: 300, ease: "Back.easeIn" });
    this.cameras.main.shake(120, 0.008);
  }

  private reiniciarVaqueros() {
    this.yo.setAngle(0).setAlpha(1);
    this.rival.setAngle(0).setAlpha(1);
  }

  private texto(contenido: string, color: string) {
    this.mensaje.setText(contenido).setColor(color);
  }
}

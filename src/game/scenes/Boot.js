import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  create() {
    this.add
      .text(400, 400, "Clique na tela para iniciar", {
        fontSize: 36,
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.stop();
      this.scene.start("Preloader");
    });
  }
}

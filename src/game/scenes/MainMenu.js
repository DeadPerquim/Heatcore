import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add
      .text(400, 400, "Iniciar partida", {
        fontSize: 36,
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.stop();
      this.scene.start("Game");
    });
  }
}

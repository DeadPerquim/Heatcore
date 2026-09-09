import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    this.add.image(400, 225, "background");

    this.add.rectangle(400, 400, 468, 32).setStrokeStyle(4, 0xffffff);
    const bar = this.add.rectangle(400 - 230, 400, 4, 28, 0xffffff);

    this.load.on("progress", (progress) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // 1. Carrega a imagem contendo os tiles (a textura em PNG)
    // Caminho relativo à raiz servida pelo Parcel (pasta "public", ver staticFiles no package.json)
    this.load.image(
      "FundoMetal",
      "assets/sprites/background-images/FundoMetal.png",
    );
    this.load.image("Personagens", "assets/sprites/characters/Personagens.png");
    this.load.image(
      "texturas_tileset1",
      "assets/sprites/environment/texturas_tileset1.png",
    );
    this.load.image("TilesPedra", "assets/sprites/environment/TilesPedra.png");

    // 2. Carrega o arquivo JSON (ou TMJ) exportado com os dados do mapa
    this.load.tilemapTiledJSON("Mapa1", "assets/maps/_mapasdojogo/Mapa1.tmj");
  }

  create() {
    this.scene.stop();
    this.scene.start("MainMenu");
  }
}

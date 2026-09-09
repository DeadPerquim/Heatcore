import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
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
}

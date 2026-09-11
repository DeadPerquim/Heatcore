import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    // Cria o mapa
    const map = this.make.tilemap({ key: "Mapa1" });

    // Conecta os tilesets
    const tilesetFundoMetal = map.addTilesetImage(
      "FundoMetal",
      "FundoMetal"
    );

    const tilesetPersonagens = map.addTilesetImage(
      "Personagens",
      "Personagens"
    );

    const tilesetTexturas1 = map.addTilesetImage(
      "texturas_tileset1",
      "texturas_tileset1"
    );

    const tilesetPedra = map.addTilesetImage(
      "TilesPedra",
      "TilesPedra"
    );

    // Lista de tilesets
    const todosOsTilesets = [
      tilesetFundoMetal,
      tilesetPersonagens,
      tilesetTexturas1,
      tilesetPedra,
    ];

    // Cria as camadas
    map.createLayer(
      "Pedras",
      todosOsTilesets,
      0,
      0
    );

    map.createLayer(
      "CenarioDeFundo",
      todosOsTilesets,
      0,
      0
    );

    map.createLayer(
      "Limites",
      todosOsTilesets,
      0,
      0
    );

    map.createLayer(
      "Objetos",
      todosOsTilesets,
      0,
      0
    );

    map.createLayer(
      "Foreground",
      todosOsTilesets,
      0,
      0
    );

    const camera = this.cameras.main;

    // Desloca o mapa para a esquerda.
    // O valor é em coordenadas do jogo (800x450).
    camera.setScroll(60, 150);

    // Informações para conferirmos no Console
    console.log("=== INFORMAÇÕES DO MAPA ===");
    console.log("Mapa:", map.widthInPixels, "x", map.heightInPixels);
    console.log("Câmera:", camera.width, "x", camera.height);
    console.log("Scroll X:", camera.scrollX);
    console.log("Scroll Y:", camera.scrollY);
  }

  update() {
    // Lógica de atualização frame a frame do jogo
  }
}
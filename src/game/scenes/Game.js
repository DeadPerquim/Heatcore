import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    // 3. Instancia o mapa usando a chave que você definiu no preload
    const map = this.make.tilemap({ key: "Mapa1" });

    // 4. Conecta a imagem carregada ao Tileset configurado no Tiled
    // ATENÇÃO: 'NomeDoTilesetNoTiled' deve ser EXATAMENTE o nome dado ao tileset dentro do software de mapa.
    const tilesetFundoMetal = map.addTilesetImage("FundoMetal", "FundoMetal");
    const tilesetPersonagens = map.addTilesetImage(
      "Personagens",
      "Personagens",
    );
    const tilesetTexturas1 = map.addTilesetImage(
      "texturas_tileset1",
      "texturas_tileset1",
    );
    const tilesetPedra = map.addTilesetImage("TilesPedra", "TilesPedra");

    // 5. Cria a camada (layer) do mapa para ser renderizada na tela
    // 'NomeDaCamadaNoTiled' também deve ser o nome exato da camada criada no editor.
    const todosOsTilesets = [
      tilesetFundoMetal,
      tilesetPersonagens,
      tilesetTexturas1,
      tilesetPedra,
    ];

    // Agora, criamos as camadas na ordem em que devem aparecer (do fundo para a frente).
    // O nome em texto DEVE ser exatamente igual ao que está na sua lista do Tiled.
    const camadaPedras = map.createLayer("Pedras", todosOsTilesets, 0, 0);
    const camadaCenario = map.createLayer(
      "CenarioDeFundo",
      todosOsTilesets,
      0,
      0,
    );
    const camadaLimites = map.createLayer("Limites", todosOsTilesets, 0, 0);
    const camadaObjetos = map.createLayer("Objetos", todosOsTilesets, 0, 0);
    const camadaForeground = map.createLayer(
      "Foreground",
      todosOsTilesets,
      0,
      0,
    );
  }

  update() {
    // Lógica de atualização frame a frame do seu jogo
  }
}

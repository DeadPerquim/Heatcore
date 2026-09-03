const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {

    // 1. Carrega a imagem contendo os tiles (a textura em PNG)
    this.load.image('FundoMetal', 'Heatcore/public/assets/sprites/background-images/FundoMetal.png');
    this.load.image('Personagens', 'Heatcore/public/assets/sprites/characters/Personagens.png');
    this.load.image('texturas_tileset1', 'Heatcore/public/assets/sprites/environment/testuras_tileset1.png');
    this.load.image('TilesPedra', 'Heatcore/public/assets/sprites/environment/TilesPedra.png');

    // 2. Carrega o arquivo JSON (ou TMJ) exportado com os dados do mapa
    this.load.tilemapTiledJSON('Mapa1', 'Heatcore/public/assets/maps/_mapasdojogo/Mapa1.tmj');
}

function create() {
    // 3. Instancia o mapa usando a chave que você definiu no preload
    const map = this.make.tilemap({ key: 'Mapa1' });

    // 4. Conecta a imagem carregada ao Tileset configurado no Tiled
    // ATENÇÃO: 'NomeDoTilesetNoTiled' deve ser EXATAMENTE o nome dado ao tileset dentro do software de mapa.
    const tilesetFundoMetal = map.addTilesetImage('FundoMetal', 'FundoMetal');
    const tilesetPersonagens = map.addTilesetImage('Personagens', 'Personagens');
    const tilesetTexturas1 = map.addTilesetImage('texturas_tileset1', 'texturas_tileset1');
    const tilesetPedra = map.addTilesetImage('TilesPedra', 'TilesPedra');

    // 5. Cria a camada (layer) do mapa para ser renderizada na tela
    // 'NomeDaCamadaNoTiled' também deve ser o nome exato da camada criada no editor.
    const todosOsTilesets = [tilesetFundoMetal, tilesetPersonagens, tilesetTexturas1, tilesetPedra];

    // Agora, criamos as camadas na ordem em que devem aparecer (do fundo para a frente).
    // O nome em texto DEVE ser exatamente igual ao que está na sua lista do Tiled.
    const camadaPedras = map.createLayer('Pedras', todosOsTilesets, 0, 0);
    const camadaCenario = map.createLayer('CenarioDeFundo', todosOsTilesets, 0, 0);
    const camadaLimites = map.createLayer('Limites', todosOsTilesets, 0, 0);
    const camadaObjetos = map.createLayer('Objetos', todosOsTilesets, 0, 0);
    const camadaForeground = map.createLayer('Foreground', todosOsTilesets, 0, 0);}

    function update() {
    // Lógica de atualização frame a frame do seu jogo
    }
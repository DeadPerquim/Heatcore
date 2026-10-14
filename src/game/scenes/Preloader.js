import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    // 1. FUNDO PRETO TIPO MONITOR ANTIGO
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0, 0);

    // 2. EFEITOS DE MONITOR CRT / SCANLINES (Mantém a identidade visual)
    let linhasTV = this.make.graphics({ add: false });
    linhasTV.fillStyle(0x000000, 0.4); 
    for (let i = 0; i < 600; i += 4) {
        linhasTV.fillRect(0, i, 800, 2);
    }
    linhasTV.generateTexture('scanlines_preload', 800, 600);
    this.add.image(0, 0, 'scanlines_preload').setOrigin(0, 0).setDepth(10);

    // 3. TÍTULO E BARRA DE CARREGAMENTO ESTILO RETRO
    this.add.text(400, 250, "CARREGANDO RECURSOS DO SISTEMA...", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 16,
      color: "#00ff00",
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 4, fill: true }
    }).setOrigin(0.5);

    // Caixa da barra de progresso (estilo wireframe verde)
    this.add.rectangle(400, 320, 468, 28).setStrokeStyle(2, 0x00ff00).setDepth(2);
    const bar = this.add.rectangle(400 - 230, 320, 4, 20, 0x00ff00).setOrigin(0, 0.5).setDepth(2);

    // Porcentagem de carregamento em texto
    const textoPorcentagem = this.add.text(400, 370, "0%", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 14,
      color: "#00ff00"
    }).setOrigin(0.5);

    // Atualiza a barra e a porcentagem conforme os arquivos do jogo carregam
    this.load.on("progress", (progress) => {
      bar.width = 4 + 460 * progress;
      textoPorcentagem.setText(Math.floor(progress * 100) + "%");
    });
  }

  preload() {
    // 1. CARREGAR O MAPA
    this.load.tilemapTiledJSON('mapa', './assets/maps/_mapasdojogo/Mapa1.json');
    this.load.tilemapTiledJSON('mapa2', './assets/maps/_mapasdojogo/Mapa2.json');

    // ATENÇÃO: As imagens devem ser arquivos de imagem (.png) e não os dados .tsj
    this.load.image('FundoMetal', './assets/sprites/background-images/FundoMetal.png');
    this.load.image('Personagens', './assets/sprites/characters/Personagens.png');
    this.load.image('Fornalha', './assets/sprites/characters/Fornalha.png');
    this.load.image('texturas_tileset1', './assets/sprites/environment/texturas_tileset1.png');
    this.load.image('TilesPedra', './assets/sprites/environment/TilesPedra.png');
    this.load.image('Espinhos', './assets/sprites/environment/Espinhos.png');
    this.load.image('logo_heatcore', './assets/logo_heatcore.png');

    // 2. CARREGAR OS SPRITESHEETS DO PERSONAGEM (Com chaves únicas)
    this.load.spritesheet('solar_andando', './assets/sprites/characters/Solar/Andando.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_caindo', './assets/sprites/characters/Solar/Caindo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_correndo', './assets/sprites/characters/Solar/Correndo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_deslizando', './assets/sprites/characters/Solar/DeslizandoParede.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_pulando', './assets/sprites/characters/Solar/Pulando.png', { frameWidth: 16, frameHeight: 16 });

    this.load.audio('boot_pc', './assets/audio/sfx/Old_90s_PC_boot_sequence.wav');
  }

  create() {
    this.scene.stop();
    this.scene.start("MainMenu");
  }
}
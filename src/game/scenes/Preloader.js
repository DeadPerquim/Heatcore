import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const width = this.scale.width || 800;
    const height = this.scale.height || 600;
    const cX = width / 2;
    const cY = height / 2;

    if (!this.textures.exists('fundo_lab_pro')) {
      const bgCanvas = this.textures.createCanvas('fundo_lab_pro', width, height);
      if (bgCanvas) {
        const ctx = bgCanvas.context;
        let grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 80, width * 0.5, height * 0.5, width * 0.85);
        grad.addColorStop(0, '#181a26');
        grad.addColorStop(0.55, '#0b0c12');
        grad.addColorStop(1, '#040406');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for (let y = 0; y < height; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
        bgCanvas.refresh();
      }
    }
    this.add.image(0, 0, 'fundo_lab_pro').setOrigin(0, 0).setDepth(0);

    let linhasTV = this.make.graphics({ add: false });
    linhasTV.fillStyle(0x000000, 0.15); 
    for (let i = 0; i < height; i += 4) {
        linhasTV.fillRect(0, i, width, 2);
    }
    linhasTV.generateTexture('scanlines_preload_mod', width, height);
    this.add.image(0, 0, 'scanlines_preload_mod').setOrigin(0, 0).setDepth(10);

    this.add.text(cX, cY - 40, "SYS_LOADER // COMPILANDO ASSETS...", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 16,
      color: "#00f3ff",
      shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 6, fill: true }
    }).setOrigin(0.5).setDepth(15);

    this.add.rectangle(cX, cY + 10, 468, 28, 0x141622).setStrokeStyle(2, 0x00f3ff).setDepth(15);
    
    const bar = this.add.rectangle(cX - 230, cY + 10, 4, 20, 0xff9900).setOrigin(0, 0.5).setDepth(15);

    const glowBar = this.add.rectangle(cX - 230, cY + 10, 4, 20, 0xff9900, 0.5)
        .setOrigin(0, 0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14);

    const textoPorcentagem = this.add.text(cX + 234, cY + 45, "0%", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: "#ff9900",
      fontStyle: "bold"
    }).setOrigin(1, 0.5).setDepth(15);

    const textoArquivo = this.add.text(cX - 234, cY + 45, "Initializing protocols...", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 11,
      color: "#8888aa"
    }).setOrigin(0, 0.5).setDepth(15);

    this.load.on("progress", (progress) => {
      let larguraAtual = 4 + 460 * progress;
      bar.width = larguraAtual;
      glowBar.width = larguraAtual;
      textoPorcentagem.setText(Math.floor(progress * 100) + "%");
    });

    this.load.on("fileprogress", (file) => {
      textoArquivo.setText("Loading module: " + file.key);
    });

    this.load.on("complete", () => {
      textoArquivo.setText("All modules loaded. Booting GUI...");
    });
  }

  preload() {
    this.load.tilemapTiledJSON('mapa', 'assets/maps/_mapasdojogo/Mapa1.json');
    this.load.tilemapTiledJSON('mapa2', 'assets/maps/_mapasdojogo/Mapa2.json');
    this.load.tilemapTiledJSON('mapa3', 'assets/maps/_mapasdojogo/Mapa3.json');

    this.load.image('FundoMetal', 'assets/sprites/background-images/FundoMetal.png');
    this.load.image('Personagens', 'assets/sprites/characters/Personagens.png');
    this.load.image('Fornalha', 'assets/sprites/characters/Fornalha.png');
    this.load.image('texturas_tileset1', 'assets/sprites/environment/texturas_tileset1.png');
    this.load.image('TilesPedra', 'assets/sprites/environment/TilesPedra.png');
    this.load.image('Espinhos', 'assets/sprites/environment/Espinhos.png');
    this.load.image('logo_heatcore', 'assets/logo_heatcore.png');

    this.load.spritesheet('solar_andando', 'assets/sprites/characters/Solar/Andando.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_caindo', 'assets/sprites/characters/Solar/Caindo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_correndo', 'assets/sprites/characters/Solar/Correndo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_deslizando', 'assets/sprites/characters/Solar/DeslizandoParede.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_pulando', 'assets/sprites/characters/Solar/Pulando.png', { frameWidth: 16, frameHeight: 16 });

    this.load.audio('boot_pc', 'assets/audio/sfx/Old_90s_PC_boot_sequence.wav');
    this.load.audio('caindo', 'assets/audio/sfx/caindo.wav');
    this.load.audio('menu', 'assets/audio/music/menu.wav');

    // Caminhos corretos para arquivos dentro da pasta public/assets/audio/sfx/menu/
    this.load.audio('pc_ligando', 'assets/audio/sfx/menu/PCLigando.mp3');
    this.load.audio('sfx_ponto1', 'assets/audio/sfx/menu/Pontos.mp3');
    this.load.audio('sfx_ponto2', 'assets/audio/sfx/menu/Pontos2.mp3');
    this.load.audio('sfx_ponto3', 'assets/audio/sfx/menu/Pontos3.mp3');

    this.load.audio('sfx_mudar_opcao', 'assets/audio/sfx/menu/MudarOpções.mp3');
    this.load.audio('sfx_clicar_botao', 'assets/audio/sfx/menu/ClicarBotão.mp3');
  }

  create() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop();
      this.scene.start("MainMenu");
    });
  }
}
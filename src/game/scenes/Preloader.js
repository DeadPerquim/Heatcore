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

    // ==========================================
    // 1. FUNDO DO LABORATÓRIO MODERNO
    // ==========================================
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

    // ==========================================
    // 2. SCANLINES MODERNAS
    // ==========================================
    let linhasTV = this.make.graphics({ add: false });
    linhasTV.fillStyle(0x000000, 0.15); 
    for (let i = 0; i < height; i += 4) {
        linhasTV.fillRect(0, i, width, 2);
    }
    linhasTV.generateTexture('scanlines_preload_mod', width, height);
    this.add.image(0, 0, 'scanlines_preload_mod').setOrigin(0, 0).setDepth(10);

    // ==========================================
    // 3. TÍTULO E UI DE CARREGAMENTO
    // ==========================================
    this.add.text(cX, cY - 40, "SYS_LOADER // COMPILING ASSETS...", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 16,
      color: "#00f3ff", // Cyan
      shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 6, fill: true }
    }).setOrigin(0.5).setDepth(15);

    // Moldura da barra de carregamento (fundo escuro, borda cyan)
    this.add.rectangle(cX, cY + 10, 468, 28, 0x141622).setStrokeStyle(2, 0x00f3ff).setDepth(15);
    
    // Preenchimento da barra de progresso (Laranja Heatcore)
    const bar = this.add.rectangle(cX - 230, cY + 10, 4, 20, 0xff9900).setOrigin(0, 0.5).setDepth(15);

    // Adicionando um brilho em torno da barra
    const glowBar = this.add.rectangle(cX - 230, cY + 10, 4, 20, 0xff9900, 0.5)
        .setOrigin(0, 0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14);

    // Porcentagem atual
    const textoPorcentagem = this.add.text(cX + 234, cY + 45, "0%", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: "#ff9900",
      fontStyle: "bold"
    }).setOrigin(1, 0.5).setDepth(15);

    // Nome do arquivo atual sendo processado (detalhe imersivo)
    const textoArquivo = this.add.text(cX - 234, cY + 45, "Initializing protocols...", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 11,
      color: "#8888aa"
    }).setOrigin(0, 0.5).setDepth(15);

    // ==========================================
    // 4. EVENTOS DO LOAD
    // ==========================================
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
    // 1. CARREGAR OS MAPAS
    this.load.tilemapTiledJSON('mapa', './assets/maps/_mapasdojogo/Mapa1.json');
    this.load.tilemapTiledJSON('mapa2', './assets/maps/_mapasdojogo/Mapa2.json');

    // 2. IMAGENS DO CENÁRIO E INTERFACE
    this.load.image('FundoMetal', './assets/sprites/background-images/FundoMetal.png');
    this.load.image('Personagens', './assets/sprites/characters/Personagens.png');
    this.load.image('Fornalha', './assets/sprites/characters/Fornalha.png');
    this.load.image('texturas_tileset1', './assets/sprites/environment/texturas_tileset1.png');
    this.load.image('TilesPedra', './assets/sprites/environment/TilesPedra.png');
    this.load.image('Espinhos', './assets/sprites/environment/Espinhos.png');
    this.load.image('logo_heatcore', './assets/logo_heatcore.png');
    this.load.image('preview_solar', 'assets/personagens/preview_solar.png');
    this.load.image('preview_fornalha', 'assets/personagens/preview_fornalha.png');

    // 3. SPRITESHEETS DO PERSONAGEM (Com chaves únicas)
    this.load.spritesheet('solar_andando', './assets/sprites/characters/Solar/Andando.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_caindo', './assets/sprites/characters/Solar/Caindo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_correndo', './assets/sprites/characters/Solar/Correndo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_deslizando', './assets/sprites/characters/Solar/DeslizandoParede.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_pulando', './assets/sprites/characters/Solar/Pulando.png', { frameWidth: 16, frameHeight: 16 });

    // 4. ÁUDIO
    this.load.audio('boot_pc', './assets/audio/sfx/Old_90s_PC_boot_sequence.wav');
    this.load.audio('caindo', './assets/audio/sfx/caindo.wav');
    this.load.audio('menu', './assets/audio/music/menu.wav');
  }

  create() {
    // Ao invés de cortar seco, adicionamos um leve "fade out" para conectar macio no MainMenu
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop();
      this.scene.start("MainMenu");
    });
  }
}
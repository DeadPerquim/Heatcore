import { Scene } from "phaser";

export class Creditos extends Scene {
  constructor() {
    super("Creditos");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ==========================================
    // 1. FUNDO DE LABORATÓRIO E ATMOSFERA
    // ==========================================
    if (this.textures.exists('fundo_lab_pro')) {
      this.add.image(0, 0, 'fundo_lab_pro').setOrigin(0, 0).setDepth(0);
    } else {
      let bgGraphics = this.make.graphics({ add: false });
      bgGraphics.fillStyle(0x0c0d12, 1);
      bgGraphics.fillRect(0, 0, width, height);
      bgGraphics.generateTexture('fundo_lab_creditos', width, height);
      this.add.image(0, 0, 'fundo_lab_creditos').setOrigin(0, 0).setDepth(0);
    }

    // Luzes ambiente pulsantes
    this.glowAmber = this.add.circle(width * 0.25, height * 0.5, 240, 0xff5500, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);
    this.glowCyan = this.add.circle(width * 0.75, height * 0.5, 240, 0x00f3ff, 0.08)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);

    this.tweens.add({
      targets: this.glowAmber,
      alpha: { from: 0.10, to: 0.22 },
      scale: { from: 0.95, to: 1.10 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: this.glowCyan,
      alpha: { from: 0.05, to: 0.14 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Faíscas flutuantes
    if (this.textures.exists('particula_brasa')) {
      this.add.particles(0, 0, 'particula_brasa', {
        x: { min: 0, max: width },
        y: { min: height + 10, max: height + 30 },
        lifespan: { min: 4000, max: 7000 },
        speedY: { min: -20, max: -55 },
        speedX: { min: -15, max: 15 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0xffaa00, 0xff4400, 0x00f3ff],
        quantity: 1,
        frequency: 250,
        blendMode: 'ADD'
      }).setDepth(2);
    }

    // Áudio do Menu
    if (this.cache.audio.exists('menu')) {
      this.musicaMenu = this.sound.get('menu');
      if (this.musicaMenu && !this.musicaMenu.isPlaying) {
        this.musicaMenu.setVolume(this.game.volumeMusica !== undefined ? this.game.volumeMusica : 0.5);
        this.musicaMenu.play();
      }
    }

    // ==========================================
    // 2. HUD INDUSTRIAL E BOTÃO VOLTAR
    // ==========================================
    this.add.text(30, 25, "MODULE // CREDITS_ARCHIVE", {
      fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#00f3ff"
    }).setAlpha(0.6).setDepth(200);

    let linhaHud = this.add.graphics().setDepth(200);
    linhaHud.lineStyle(1, 0x00f3ff, 0.3);
    linhaHud.lineBetween(30, 45, 240, 45);

    // Botão Voltar Fixo
    this.btnVoltar = this.add.text(width - 30, height - 25, "> [ VOLTAR / ESC ] <", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 13,
      color: "#ff9900",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(1, 1).setDepth(200).setInteractive({ useHandCursor: true });

    this.btnVoltar.on('pointerover', () => this.btnVoltar.setColor("#ffffff"));
    this.btnVoltar.on('pointerout', () => this.btnVoltar.setColor("#ff9900"));
    this.btnVoltar.on('pointerdown', () => this.voltarParaMenu());

    // ==========================================
    // 3. IMAGEM DO TÍTULO FIXA NO TOPO
    // ==========================================
    const topoY = 85;

    // Fundo totalmente opaco (alpha 1) e um pouco mais alto para bloquear 100% o texto vazando
    this.add.rectangle(width / 2, 80, width, 180, 0x080910, 1).setDepth(140);

    this.logoGlow = this.add.circle(width / 2, topoY, 95, 0xff6600, 0.22)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(150);

    if (this.textures.exists('logo_heatcore')) {
      this.logoHeader = this.add.image(width / 2, topoY, 'logo_heatcore')
          .setScale(0.52)
          .setDepth(151);
    } else {
      this.logoHeader = this.add.text(width / 2, topoY, "HEATCORE", {
        fontFamily: "'Courier New', Courier, monospace", fontSize: 34, color: "#ff9900", fontStyle: "bold"
      }).setOrigin(0.5).setDepth(151);
    }

    // Linha divisória sob o título
    let linhaTitulo = this.add.graphics().setDepth(152);
    linhaTitulo.lineStyle(2, 0xff9900, 0.7);
    linhaTitulo.lineBetween((width / 2) - 180, 150, (width / 2) + 180, 150);

    // ==========================================
    // 4. CRÉDITOS ROLANTES COM MÁSCARA ISOLADA
    // ==========================================
    this.limiteTopo = 165; // Máscara começa exatamente abaixo da linha divisória
    const limiteRodape = height - 50; 
    const alturaJanela = limiteRodape - this.limiteTopo;

    // Máscara Geométrica
    const maskGraphics = this.make.graphics({ add: false });
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(0, this.limiteTopo, width, alturaJanela);
    const mask = maskGraphics.createGeometryMask();

    this.containerCreditos = this.add.container(width / 2, limiteRodape).setDepth(50);
    this.containerCreditos.setMask(mask);

    const secoesCreditos = [
      {
        titulo: "DIREÇÃO GERAL & CONCEITO",
        nomes: ["[ GABRIEL FERREIRA DE SOUZA DA SILVA ]"]
      },
      {
        titulo: "PROGRAMAÇÃO & GAMEPLAY",
        nomes: ["[ GABRIEL FERREIRA DE SOUZA DA SILVA ]", "[ DANIEL BENTES PERQUIM ]"]
      },
      {
        titulo: "ARTE & ANIMAÇÃO 2D",
        nomes: ["[ GABRIEL FERREIRA DE SOUZA DA SILVA ]"]
      },
      {
        titulo: "DESIGN DE NÍVEIS (LEVEL DESIGN)",
        nomes: ["[ DANIEL BENTES PERQUIM ]"]
      },
      {
        titulo: "ARQUITETURA MULTIPLAYER & REDE",
        nomes: ["[ GABRIEL FERREIRA DE SOUZA DA SILVA ]"]
      },
      {
        titulo: "MÚSICA & DESIGN DE SOM (SFX)",
        nomes: ["[ DANIEL BENTES PERQUIM ]"]
      },
      {
        titulo: "GARANTIA DE QUALIDADE (QA & TESTES)",
        nomes: ["[ GABRIEL FERREIRA DE SOUZA DA SILVA ]", "[ DANIEL BENTES PERQUIM ]"]
      },
      {
        titulo: "TECNOLOGIAS UTILIZADAS",
        nomes: ["PHASER 3 FRAMEWORK", "SOCKET.IO", "TILED MAP EDITOR", "NODE.JS / EXPRESS"]
      },
      {
        titulo: "AGRADECIMENTOS ESPECIAIS",
        nomes: ["PROFESSORES & MONITORES", "COMUNIDADE OPEN SOURCE", "E A VOCÊ POR JOGAR!"]
      }
    ];

    let offsetY = 0;

    secoesCreditos.forEach((secao) => {
      let txtTitulo = this.add.text(0, offsetY, `// ${secao.titulo}`, {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 17,
        color: "#00f3ff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      this.containerCreditos.add(txtTitulo);
      offsetY += 32;

      secao.nomes.forEach((nome) => {
        let txtNome = this.add.text(0, offsetY, nome, {
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 15,
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2
        }).setOrigin(0.5);

        this.containerCreditos.add(txtNome);
        offsetY += 28;
      });

      offsetY += 40;
    });

    this.alturaTotalCreditos = offsetY;
    
    // Velocidade bastante reduzida para leitura confortável
    this.velocidadeRolagem = 25;

    this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.jaSaindo = false;
  }

  update(time, delta) {
    if (this.jaSaindo) return;

    if (Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
      this.voltarParaMenu();
      return;
    }

    const pad = this.input.gamepad ? (this.input.gamepad.pad1 || this.input.gamepad.getPad(0)) : null;
    if (pad && (pad.B || (pad.buttons.length > 1 && pad.buttons[1].pressed))) {
      this.voltarParaMenu();
      return;
    }

    const deltaSegundos = delta / 1000;
    this.containerCreditos.y -= this.velocidadeRolagem * deltaSegundos;

    // Subtrai 150 pixels extras (~6 segundos adicionais na velocidade 25) antes de fechar
    if (this.containerCreditos.y < this.limiteTopo - this.alturaTotalCreditos - 150) {
      this.voltarParaMenu();
    }
  }

  voltarParaMenu() {
    if (this.jaSaindo) return;
    this.jaSaindo = true;

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MainMenu");
    });
  }
}
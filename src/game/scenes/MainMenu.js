import { Scene } from "phaser";
import { io } from "socket.io-client";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    // ==========================================
    // 0. CONFIGURAÇÃO GLOBAL DE ÁUDIO
    // ==========================================
    if (this.game.volumeMusica === undefined) this.game.volumeMusica = 0.5;
    if (this.game.volumeSFX === undefined) this.game.volumeSFX = 0.7;

    // ==========================================
    // 0.1 CONEXÃO COM O SERVIDOR MULTIPLAYER
    // ==========================================
    const SERVER_URL = window.location.origin;

    if (!this.game.socket) {
      this.game.socket = io(SERVER_URL);
    }
    this.socket = this.game.socket;

    this.socket.on('inicializarMapa', (dados) => {
        this.socket.sementeMapaAtual = dados.semente;
    });

    this.personagensOcupados = { solar: false, fornalha: false };

    this.socket.on('estadoPersonagens', (estado) => {
      this.personagensOcupados.solar = !!estado.solar && estado.solar !== this.socket.id;
      this.personagensOcupados.fornalha = !!estado.fornalha && estado.fornalha !== this.socket.id;
      
      if (this.overlayAtivo) {
        if (this.overlayIndex === 0 && this.personagensOcupados.solar) this.overlayIndex = 1;
        if (this.overlayIndex === 1 && this.personagensOcupados.fornalha) this.overlayIndex = 0;
        this.atualizarVisualOverlay();
      }
    });

    this.socket.on('erroSelecao', (data) => {
      console.warn(data.mensagem);
      this.jaIniciou = false;
    });

    // ==========================================
    // 1. FUNDO DE LABORATÓRIO
    // ==========================================
    if (!this.textures.exists('fundo_lab_pro')) {
      const bgCanvas = this.textures.createCanvas('fundo_lab_pro', width, height);
      if (bgCanvas) {
        const ctx = bgCanvas.context;
        let grad = ctx.createRadialGradient(width * 0.35, height * 0.45, 80, width * 0.5, height * 0.5, width * 0.85);
        grad.addColorStop(0, '#181a26');
        grad.addColorStop(0.55, '#0b0c12');
        grad.addColorStop(1, '#040406');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 35) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 35) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        bgCanvas.refresh();
      }
    }

    this.add.image(0, 0, 'fundo_lab_pro').setOrigin(0, 0);

    this.glowAmber = this.add.circle(width * 0.32, height * 0.42, 260, 0xff5500, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD);
    this.glowCyan = this.add.circle(width * 0.8, height * 0.7, 220, 0x00f3ff, 0.06)
        .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: this.glowAmber,
      alpha: { from: 0.10, to: 0.22 },
      scale: { from: 0.95, to: 1.12 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: this.glowCyan,
      alpha: { from: 0.04, to: 0.10 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (!this.textures.exists('particula_brasa')) {
      let pGraphics = this.make.graphics({ add: false });
      pGraphics.fillStyle(0xffffff, 1);
      pGraphics.fillCircle(4, 4, 4);
      pGraphics.generateTexture('particula_brasa', 8, 8);
    }

    this.add.particles(0, 0, 'particula_brasa', {
      x: { min: 0, max: width },
      y: { min: height + 10, max: height + 30 },
      lifespan: { min: 4000, max: 7000 },
      speedY: { min: -20, max: -55 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0xffaa00, 0xff4400, 0x00f3ff, 0xffffff],
      quantity: 1,
      frequency: 220,
      blendMode: 'ADD'
    });

    if (this.cache.audio.exists('menu')) {
      if (!this.sound.get('menu')) {
        this.musicaMenu = this.sound.add('menu', { loop: true, volume: this.game.volumeMusica });
        this.musicaMenu.play();
      } else {
        this.musicaMenu = this.sound.get('menu');
        this.musicaMenu.setVolume(this.game.volumeMusica);
        if (!this.musicaMenu.isPlaying) this.musicaMenu.play();
      }
    }

    // ==========================================
    // 2. HUD INDUSTRIAL
    // ==========================================
    const corHud = "#00f3ff";
    this.add.text(30, 25, "SYS_STATUS // ONLINE", {
      fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: corHud
    }).setAlpha(0.6);

    this.add.text(30, 42, "FACILITY: SUB_LEVEL_02", {
      fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#8888aa"
    }).setAlpha(0.5);

    this.add.text(width - 30, height - 30, "HEATCORE v1.1.0 - MODOS DIÁRIOS", {
      fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#8888aa"
    }).setOrigin(1, 1).setAlpha(0.5);

    let linhaHud = this.add.graphics();
    linhaHud.lineStyle(1, 0x00f3ff, 0.3);
    linhaHud.lineBetween(30, 60, 220, 60);

    // ==========================================
    // 3. LOGO
    // ==========================================
    this.logoInicialX = width * 0.325;
    this.logoInicialY = height * 0.415;

    this.logoGlow = this.add.circle(this.logoInicialX, this.logoInicialY, 140, 0xff6600, 0.25)
        .setBlendMode(Phaser.BlendModes.ADD);

    this.logo = this.add.image(this.logoInicialX, this.logoInicialY - 50, 'logo_heatcore')
        .setOrigin(0.5)
        .setScale(0.82)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: [this.logo, this.logoGlow],
      y: this.logoInicialY,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });

    // ==========================================
    // 4. MENU PRINCIPAL & SUBMENU DIÁRIO
    // ==========================================
    this.baseMenuX = width * 0.92; 
    this.startY = height * 0.315; 

    this.modoDiarioSelecionado = "PLATAFORMAS";

    this.menuOptions = [
      { text: "JOGAR", action: () => this.abrirSelecaoPersonagem("Game") },
      { text: "MAPAS DIÁRIOS", action: () => this.abrirSubmenuDiario() },
      { text: "OPÇÕES", action: () => this.abrirOpcoes() },
      { text: "CRÉDITOS", action: () => this.irParaCreditos() }
    ];

    this.selectedIndex = 0; 
    this.btnObjects = [];
    this.estadoMenu = "MAIN"; // MAIN | SUBMENU_DIARIO | OPTIONS

    this.btnHighlightBg = this.add.rectangle(this.baseMenuX + 20, this.startY, 310, 48, 0xff9900, 0.15)
        .setOrigin(1, 0.5)
        .setStrokeStyle(1.5, 0xff9900, 0.8)
        .setAlpha(0);

    this.containerBotoesMenu = this.add.container(0, 0);

    this.menuOptions.forEach((option, index) => {
      let btnContainer = this.add.container(this.baseMenuX + 100, this.startY + (index * 75));

      let btnText = this.add.text(0, 0, option.text, {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 28,
        color: index === 0 ? "#ff9900" : "#666677",
        fontStyle: "bold",
        align: "right",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
      }).setOrigin(1, 0.5);

      btnContainer.add(btnText);
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(-260, -25, 260, 50), Phaser.Geom.Rectangle.Contains);

      this.tweens.add({
        targets: btnContainer,
        x: this.baseMenuX,
        duration: 800,
        delay: 300 + (index * 150),
        ease: 'Back.easeOut'
      });

      btnContainer.on('pointerover', () => {
        if (!this.overlayAtivo && this.estadoMenu === "MAIN") {
          this.selectedIndex = index;
          this.atualizarSelecaoVisual();
        }
      });

      btnContainer.on('pointerdown', () => {
        if (!this.overlayAtivo && this.estadoMenu === "MAIN") {
          option.action();
        }
      });

      this.btnObjects.push({ container: btnContainer, text: btnText });
      this.containerBotoesMenu.add(btnContainer);
    });

    // Controles
    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.jaIniciou = false;
    this.overlayAtivo = false;
    this.inputCooldown = 0; 

    this.criarSubmenuDiario();
    this.criarMenuOpcoes();
    this.criarOverlayPersonagens();
    this.atualizarSelecaoVisual();

    this.scale.on('fullscreenchange', () => {
      if (this.toggleFullscreen) this.toggleFullscreen.atualizarVisual();
    });

    document.addEventListener('fullscreenchange', () => {
      if (this.toggleFullscreen) this.toggleFullscreen.atualizarVisual();
    });
  }

  // ==========================================
  // CONSTRUÇÃO DO SUBMENU DE MAPAS DIÁRIOS
  // ==========================================
  criarSubmenuDiario() {
    const posX = this.baseMenuX + 350; 

    this.containerSubmenuDiario = this.add.container(posX, this.startY - 10).setAlpha(0);

    const tituloDiario = this.add.text(0, -10, "// ESCOLHA O DESAFIO DIÁRIO", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 18,
      color: "#00f3ff",
      fontStyle: "bold"
    }).setOrigin(1, 0.5);

    this.opcoesModosDiarios = [
      { id: "PLATAFORMAS", label: "PLATAFORMAS" },
      { id: "LABIRINTO",   label: "LABIRINTO" },
      { id: "VOLTAR",      label: "> [ VOLTAR ] <" }
    ];

    this.btnObjetosDiario = [];
    this.diarioIndex = 0;

    this.opcoesModosDiarios.forEach((item, index) => {
      let btnTxt = this.add.text(0, 45 + (index * 60), item.label, {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 22,
        color: index === 0 ? "#ff9900" : "#666677",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      btnTxt.on('pointerover', () => {
        if (this.estadoMenu === "SUBMENU_DIARIO") {
          this.diarioIndex = index;
          this.atualizarSelecaoDiario();
        }
      });

      btnTxt.on('pointerdown', () => {
        if (this.estadoMenu === "SUBMENU_DIARIO") {
          this.confirmarOpcaoDiario();
        }
      });

      this.btnObjetosDiario.push(btnTxt);
    });

    this.containerSubmenuDiario.add([tituloDiario, ...this.btnObjetosDiario]);
  }

  abrirSubmenuDiario() {
    if (this.estadoMenu === "SUBMENU_DIARIO") return;
    this.estadoMenu = "SUBMENU_DIARIO";
    this.inputCooldown = 250;
    this.diarioIndex = 0;
    this.atualizarSelecaoDiario();

    this.tweens.add({ targets: this.btnHighlightBg, alpha: 0, duration: 150 });

    this.tweens.add({
      targets: this.containerBotoesMenu,
      x: 350,
      alpha: 0,
      duration: 350,
      ease: 'Back.easeIn'
    });

    this.tweens.add({
      targets: this.containerSubmenuDiario,
      x: this.baseMenuX,
      alpha: 1,
      duration: 400,
      delay: 150,
      ease: 'Back.easeOut'
    });
  }

  fecharSubmenuDiario() {
    if (this.estadoMenu === "MAIN") return;
    this.estadoMenu = "MAIN";
    this.inputCooldown = 250;

    this.tweens.add({
      targets: this.containerSubmenuDiario,
      x: this.baseMenuX + 350,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn'
    });

    this.tweens.add({
      targets: this.containerBotoesMenu,
      x: 0,
      alpha: 1,
      duration: 400,
      delay: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.atualizarSelecaoVisual();
      }
    });
  }

  atualizarSelecaoDiario() {
    this.btnObjetosDiario.forEach((btn, index) => {
      const isSelected = index === this.diarioIndex;
      if (isSelected) {
        btn.setColor("#ff9900");
      } else {
        btn.setColor(index === 2 ? "#ff4444" : "#666677");
      }
    });
  }

  confirmarOpcaoDiario() {
    const opcao = this.opcoesModosDiarios[this.diarioIndex];
    if (opcao.id === "VOLTAR") {
      this.fecharSubmenuDiario();
    } else {
      this.modoDiarioSelecionado = opcao.id;
      this.abrirSelecaoPersonagem("Diario");
    }
  }

  irParaCreditos() {
    if (this.jaIniciou) return;
    this.jaIniciou = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("Creditos");
    });
  }

  // ==========================================
  // MENU DE OPÇÕES
  // ==========================================
  criarMenuOpcoes() {
    const posX = this.baseMenuX + 350; 

    this.containerOpcoes = this.add.container(posX, this.startY - 30).setAlpha(0);

    const tituloOpcoes = this.add.text(0, 0, "// AJUSTES DO SISTEMA", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 20,
      color: "#00f3ff",
      fontStyle: "bold"
    }).setOrigin(1, 0.5);

    this.sliderMusica = this.criarSliderAudio(0, 55, "MÚSICA", this.game.volumeMusica, (val) => {
      this.game.volumeMusica = val;
      if (this.musicaMenu) this.musicaMenu.setVolume(val);
    });

    this.sliderSFX = this.criarSliderAudio(0, 125, "EFEITOS SONOROS", this.game.volumeSFX, (val) => {
      this.game.volumeSFX = val;
    });

    this.toggleFullscreen = this.criarToggleFullscreen(0, 195, "TELA CHEIA", () => {
      this.alternarTelaCheia();
    });

    this.btnVoltarOpcoes = this.add.text(0, 265, "> [ VOLTAR ] <", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 24,
      color: "#ff9900",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    this.btnVoltarOpcoes.on('pointerover', () => {
      this.opcoesIndex = 3;
      this.atualizarSelecaoOpcoes();
    });

    this.btnVoltarOpcoes.on('pointerdown', () => {
      this.fecharOpcoes();
    });

    this.containerOpcoes.add([
      tituloOpcoes,
      this.sliderMusica.container,
      this.sliderSFX.container,
      this.toggleFullscreen.container,
      this.btnVoltarOpcoes
    ]);

    this.opcoesIndex = 0;
  }

  criarSliderAudio(x, y, rotulo, valorInicial, onChange) {
    const container = this.add.container(x, y);
    const larguraTrilho = 220;

    const textoRotulo = this.add.text(-larguraTrilho - 20, -18, rotulo, {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0, 0.5);

    const textoPorcentagem = this.add.text(0, -18, `${Math.round(valorInicial * 100)}%`, {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: "#ff9900",
      fontStyle: "bold"
    }).setOrigin(1, 0.5);

    const trilhoBg = this.add.rectangle(-larguraTrilho, 10, larguraTrilho, 10, 0x1f2233)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x444455);

    const barraPreenchimento = this.add.rectangle(-larguraTrilho, 10, larguraTrilho * valorInicial, 10, 0xff9900)
        .setOrigin(0, 0.5);

    const knob = this.add.rectangle(-larguraTrilho + (larguraTrilho * valorInicial), 10, 16, 24, 0x00f3ff)
        .setOrigin(0.5, 0.5)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });

    const areaClique = this.add.rectangle(-larguraTrilho / 2, 10, larguraTrilho + 40, 40, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

    let arrastando = false;

    const atualizarPorPointer = (pointer) => {
      const trilhoInicioWorldX = this.containerOpcoes.x + x - larguraTrilho;
      const localX = pointer.x - trilhoInicioWorldX;
      let pct = Phaser.Math.Clamp(localX / larguraTrilho, 0, 1);

      knob.x = -larguraTrilho + (larguraTrilho * pct);
      barraPreenchimento.width = larguraTrilho * pct;
      textoPorcentagem.setText(`${Math.round(pct * 100)}%`);
      onChange(pct);
    };

    const iniciarArrasto = (pointer) => {
      arrastando = true;
      knob.setFillStyle(0xff9900);
      atualizarPorPointer(pointer);
    };

    knob.on('pointerdown', iniciarArrasto);
    areaClique.on('pointerdown', iniciarArrasto);

    this.input.on('pointermove', (pointer) => {
      if (arrastando && pointer.isDown) {
        atualizarPorPointer(pointer);
      }
    });

    this.input.on('pointerup', () => {
      if (arrastando) {
        arrastando = false;
        knob.setFillStyle(0x00f3ff);
      }
    });

    container.add([textoRotulo, textoPorcentagem, trilhoBg, barraPreenchimento, knob, areaClique]);

    return {
      container,
      knob,
      barraPreenchimento,
      textoPorcentagem,
      textoRotulo,
      larguraTrilho,
      getValor: () => barraPreenchimento.width / larguraTrilho,
      setValor: (val) => {
        let pct = Phaser.Math.Clamp(val, 0, 1);
        knob.x = -larguraTrilho + (larguraTrilho * pct);
        barraPreenchimento.width = larguraTrilho * pct;
        textoPorcentagem.setText(`${Math.round(pct * 100)}%`);
        onChange(pct);
      }
    };
  }

  criarToggleFullscreen(x, y, rotulo, onToggle) {
    const container = this.add.container(x, y);
    const larguraTrilho = 220;

    const textoRotulo = this.add.text(-larguraTrilho - 20, 0, rotulo, {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0, 0.5);

    const estaEmTelaCheia = !!document.fullscreenElement || this.scale.isFullscreen;
    
    const textoStatus = this.add.text(0, 0, estaEmTelaCheia ? "[ X ] ATIVADO" : "[   ] DESATIVADO", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: estaEmTelaCheia ? "#00ff66" : "#8888aa",
      fontStyle: "bold"
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    textoStatus.on('pointerover', () => {
      this.opcoesIndex = 2;
      this.atualizarSelecaoOpcoes();
    });

    textoStatus.on('pointerdown', () => {
      onToggle();
    });

    container.add([textoRotulo, textoStatus]);

    const funcaoAtualizar = () => {
      setTimeout(() => {
        const ativo = !!document.fullscreenElement || this.scale.isFullscreen;
        textoStatus.setText(ativo ? "[ X ] ATIVADO" : "[   ] DESATIVADO");
        textoStatus.setColor(ativo ? "#00ff66" : "#8888aa");
      }, 50);
    };

    return {
      container,
      textoRotulo,
      textoStatus,
      atualizarVisual: funcaoAtualizar
    };
  }

  alternarTelaCheia() {
    const estaAtivo = !!document.fullscreenElement || this.scale.isFullscreen;

    if (estaAtivo) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else {
        this.scale.stopFullscreen();
      }
    } else {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        this.scale.startFullscreen();
      }
    }

    if (this.toggleFullscreen) {
      this.toggleFullscreen.atualizarVisual();
    }
  }

  atualizarSelecaoOpcoes() {
    this.sliderMusica.textoRotulo.setColor(this.opcoesIndex === 0 ? "#ff9900" : "#ffffff");
    this.sliderSFX.textoRotulo.setColor(this.opcoesIndex === 1 ? "#ff9900" : "#ffffff");
    this.toggleFullscreen.textoRotulo.setColor(this.opcoesIndex === 2 ? "#ff9900" : "#ffffff");
    this.btnVoltarOpcoes.setColor(this.opcoesIndex === 3 ? "#ffffff" : "#ff9900");
  }

  abrirOpcoes() {
    if (this.estadoMenu === "OPTIONS") return;
    this.estadoMenu = "OPTIONS";
    this.inputCooldown = 250;
    this.opcoesIndex = 0;
    
    if (this.toggleFullscreen) {
      this.toggleFullscreen.atualizarVisual();
    }
    
    this.atualizarSelecaoOpcoes();

    this.tweens.add({ targets: this.btnHighlightBg, alpha: 0, duration: 150 });

    this.tweens.add({
      targets: this.containerBotoesMenu,
      x: 350,
      alpha: 0,
      duration: 350,
      ease: 'Back.easeIn'
    });

    this.tweens.add({
      targets: this.containerOpcoes,
      x: this.baseMenuX,
      alpha: 1,
      duration: 400,
      delay: 150,
      ease: 'Back.easeOut'
    });
  }

  fecharOpcoes() {
    if (this.estadoMenu === "MAIN") return;
    this.estadoMenu = "MAIN";
    this.inputCooldown = 250;

    this.tweens.add({
      targets: this.containerOpcoes,
      x: this.baseMenuX + 350,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn'
    });

    this.tweens.add({
      targets: this.containerBotoesMenu,
      x: 0,
      alpha: 1,
      duration: 400,
      delay: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.atualizarSelecaoVisual();
      }
    });
  }

  criarOverlayPersonagens() {
    const { width, height } = this.scale;
    const cX = width / 2;
    const cY = height / 2;

    this.overlayContainer = this.add.container(0, 0).setDepth(500).setVisible(false);

    this.fundoEscuro = this.add.rectangle(0, 0, width, height, 0x040508, 0.88)
        .setOrigin(0, 0)
        .setInteractive();

    this.painelGroup = this.add.container(cX, cY);

    const painelLargura = Math.min(560, width * 0.92);
    const painelAltura = Math.min(350, height * 0.88);

    const painel = this.add.rectangle(0, 0, painelLargura, painelAltura, 0x0c0d16)
        .setStrokeStyle(2, 0x00f3ff);

    const molduraExterna = this.add.rectangle(0, 0, painelLargura + 8, painelAltura + 8, 0x000000, 0)
        .setStrokeStyle(1, 0xff9900, 0.5);

    const topoBarra = this.add.rectangle(0, -(painelAltura / 2) + 20, painelLargura, 40, 0x141624);
    const luzStatus = this.add.circle(-(painelLargura / 2) + 25, -(painelAltura / 2) + 20, 5, 0x00ff66);
    
    this.tweens.add({
      targets: luzStatus,
      alpha: { from: 0.3, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    const titulo = this.add.text(0, -(painelAltura / 2) + 20, "// SELEÇÃO DE OPERADOR //", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 16,
      color: "#00f3ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.cardSolar = this.criarCardPersonagem(-125, 15, "SOLAR", () => {
      if (this.inputCooldown <= 0 && !this.personagensOcupados.solar) this.confirmarSelecao("solar");
    });

    this.cardFornalha = this.criarCardPersonagem(125, 15, "FORNALHA", () => {
      if (this.inputCooldown <= 0 && !this.personagensOcupados.fornalha) this.confirmarSelecao("fornalha");
    });

    this.btnCancelarOverlay = this.add.text(0, painelAltura * 0.39, "[ ESC / VOLTAR ]", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 14,
      color: "#ff4444",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.btnCancelarOverlay.on('pointerover', () => this.btnCancelarOverlay.setColor("#ffffff"));
    this.btnCancelarOverlay.on('pointerout', () => this.btnCancelarOverlay.setColor("#ff4444"));

    this.btnCancelarOverlay.on('pointerdown', () => {
      if (this.inputCooldown <= 0) this.fecharOverlay();
    });

    this.painelGroup.add([
      painel,
      molduraExterna,
      topoBarra,
      luzStatus,
      titulo,
      this.cardSolar.container,
      this.cardFornalha.container,
      this.btnCancelarOverlay
    ]);

    this.overlayContainer.add([
      this.fundoEscuro,
      this.painelGroup
    ]);

    this.overlayIndex = 0;
  }

  criarCardPersonagem(x, y, nome, onSelect) {
    const containerCard = this.add.container(x, y);

    const bgCard = this.add.rectangle(0, 0, 200, 200, 0x141622)
        .setStrokeStyle(2, 0x333345)
        .setInteractive({ useHandCursor: true });

    const scannerGlow = this.add.rectangle(0, 0, 190, 190, 0xff9900, 0.12).setVisible(false);

    const cantoneiras = this.add.graphics();
    cantoneiras.lineStyle(2, 0x00f3ff, 0.8);
    cantoneiras.moveTo(-90, -75); cantoneiras.lineTo(-90, -90); cantoneiras.lineTo(-75, -90);
    cantoneiras.moveTo(75, -90); cantoneiras.lineTo(90, -90); cantoneiras.lineTo(90, -75);
    cantoneiras.moveTo(-90, 75); cantoneiras.lineTo(-90, 90); cantoneiras.lineTo(-75, 90);
    cantoneiras.moveTo(75, 90); cantoneiras.lineTo(90, 90); cantoneiras.lineTo(75, 90);
    cantoneiras.strokePath();

    let spritePreview;

    if (this.textures.exists('Personagens')) {
      const tex = this.textures.get('Personagens');
      const img = tex.getSourceImage();
      const halfW = Math.floor(img.width / 2);
      const h = img.height;

      const frameKey = (nome === "SOLAR") ? 'preview_solar_frame' : 'preview_fornalha_frame';
      
      if (!tex.has(frameKey)) {
        const frameX = (nome === "SOLAR") ? 0 : halfW;
        tex.add(frameKey, 0, frameX, 0, halfW, h);
      }

      spritePreview = this.add.image(0, -18, 'Personagens', frameKey).setDisplaySize(95, 95);
    } else {
      spritePreview = this.add.rectangle(0, -18, 90, 90, 0x222233).setStrokeStyle(1, 0x555577);
    }

    const textoNome = this.add.text(0, 52, nome, {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 18,
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const bgBadge = this.add.rectangle(0, 74, 110, 18, 0x000000, 0.6);
    const textoStatus = this.add.text(0, 74, "[ LIVRE ]", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 11,
      color: "#00ff66",
      fontStyle: "bold"
    }).setOrigin(0.5);

    bgCard.on('pointerover', () => {
      if (this.overlayAtivo) {
        const targetIndex = (nome === "SOLAR") ? 0 : 1;
        const estaOcupado = (targetIndex === 0) ? this.personagensOcupados.solar : this.personagensOcupados.fornalha;
        if (!estaOcupado) {
          this.overlayIndex = targetIndex;
          this.atualizarVisualOverlay();
        }
      }
    });

    bgCard.on('pointerdown', onSelect);

    containerCard.add([
      bgCard, 
      scannerGlow, 
      cantoneiras, 
      spritePreview, 
      textoNome, 
      bgBadge, 
      textoStatus
    ]);

    return { 
      container: containerCard, 
      bgCard: bgCard, 
      scannerGlow: scannerGlow,
      cantoneiras: cantoneiras,
      textoNome: textoNome, 
      textoStatus: textoStatus, 
      spritePreview: spritePreview 
    };
  }

  abrirSelecaoPersonagem(cenaDestino) {
    this.cenaDestino = cenaDestino;
    this.overlayAtivo = true;
    
    this.overlayIndex = this.personagensOcupados.solar ? 1 : 0;
    this.inputCooldown = 350; 
    
    this.overlayContainer.setVisible(true);
    this.atualizarVisualOverlay();

    this.fundoEscuro.setAlpha(0);
    this.painelGroup.setAlpha(0).setScale(0.75);

    this.tweens.add({ targets: this.fundoEscuro, alpha: 0.88, duration: 200, ease: 'Linear' });
    this.tweens.add({ targets: this.painelGroup, alpha: 1, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });
  }

  fecharOverlay() {
    if (!this.overlayAtivo) return;
    this.overlayAtivo = false;
    this.inputCooldown = 300;

    this.socket.emit('liberarPersonagem');

    this.tweens.add({ targets: this.fundoEscuro, alpha: 0, duration: 200, ease: 'Linear' });
    this.tweens.add({
      targets: this.painelGroup,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => { this.overlayContainer.setVisible(false); }
    });
  }

  atualizarVisualOverlay() {
    if (this.personagensOcupados.solar) {
      this.cardSolar.bgCard.setStrokeStyle(2, 0x22222a).setFillStyle(0x0e0e14);
      this.cardSolar.scannerGlow.setVisible(false);
      this.cardSolar.cantoneiras.setAlpha(0.2);
      this.cardSolar.textoNome.setColor("#444455");
      this.cardSolar.spritePreview.setAlpha(0.2);
      this.cardSolar.textoStatus.setText("EM USO").setColor("#ff3333");
    } else if (this.overlayIndex === 0) {
      this.cardSolar.bgCard.setStrokeStyle(3, 0xff9900).setFillStyle(0x1d2133);
      this.cardSolar.scannerGlow.setVisible(true);
      this.cardSolar.cantoneiras.setAlpha(1);
      this.cardSolar.textoNome.setColor("#ff9900");
      this.cardSolar.spritePreview.setAlpha(1);
      this.cardSolar.textoStatus.setText("PRONTO").setColor("#00f3ff");
    } else {
      this.cardSolar.bgCard.setStrokeStyle(2, 0x333345).setFillStyle(0x141622);
      this.cardSolar.scannerGlow.setVisible(false);
      this.cardSolar.cantoneiras.setAlpha(0.5);
      this.cardSolar.textoNome.setColor("#ffffff");
      this.cardSolar.spritePreview.setAlpha(0.85);
      this.cardSolar.textoStatus.setText("LIVRE").setColor("#00ff66");
    }

    if (this.personagensOcupados.fornalha) {
      this.cardFornalha.bgCard.setStrokeStyle(2, 0x22222a).setFillStyle(0x0e0e14);
      this.cardFornalha.scannerGlow.setVisible(false);
      this.cardFornalha.cantoneiras.setAlpha(0.2);
      this.cardFornalha.textoNome.setColor("#444455");
      this.cardFornalha.spritePreview.setAlpha(0.2);
      this.cardFornalha.textoStatus.setText("EM USO").setColor("#ff3333");
    } else if (this.overlayIndex === 1) {
      this.cardFornalha.bgCard.setStrokeStyle(3, 0xff9900).setFillStyle(0x1d2133);
      this.cardFornalha.scannerGlow.setVisible(true);
      this.cardFornalha.cantoneiras.setAlpha(1);
      this.cardFornalha.textoNome.setColor("#ff9900");
      this.cardFornalha.spritePreview.setAlpha(1);
      this.cardFornalha.textoStatus.setText("PRONTO").setColor("#00f3ff");
    } else {
      this.cardFornalha.bgCard.setStrokeStyle(2, 0x333345).setFillStyle(0x141622);
      this.cardFornalha.scannerGlow.setVisible(false);
      this.cardFornalha.cantoneiras.setAlpha(0.5);
      this.cardFornalha.textoNome.setColor("#ffffff");
      this.cardFornalha.spritePreview.setAlpha(0.85);
      this.cardFornalha.textoStatus.setText("LIVRE").setColor("#00ff66");
    }
  }

  confirmarSelecao(personagemEscolhido) {
    if (this.jaIniciou) return;
    
    this.game.meuPersonagem = personagemEscolhido;
    this.socket.emit('selecionarPersonagem', personagemEscolhido);

    const cardEscolhido = (personagemEscolhido === 'solar') ? this.cardSolar.container : this.cardFornalha.container;

    this.jaIniciou = true;
    this.overlayAtivo = false;

    this.tweens.add({
      targets: cardEscolhido,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        if (this.musicaMenu) {
            this.musicaMenu.stop();
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.stop();
          this.scene.start(this.cenaDestino, {
            personagem: personagemEscolhido,
            modoDiario: this.modoDiarioSelecionado,
            pontosSolar: 0,
            pontosFornalha: 0,
            offsetDias: 0
          });
        });
      }
    });
  }

  update(time, delta) {
    const ponteiro = this.input.activePointer;
    let deslocamentoX = (ponteiro.x - this.logoInicialX) / 35;
    let deslocamentoY = (ponteiro.y - this.logoInicialY) / 45;

    this.logo.x = this.logoInicialX + deslocamentoX;
    this.logo.y = this.logoInicialY + deslocamentoY;
    this.logo.rotation = deslocamentoX * 0.002;

    this.logoGlow.x = this.logo.x;
    this.logoGlow.y = this.logo.y;

    if (this.jaIniciou) return;

    this.inputCooldown -= delta;
    const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;

    if (this.overlayAtivo) {
      if (this.inputCooldown > 0) return;

      let alternarEsq = Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyA);
      let alternarDir = Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyD);
      let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);
      let cancelar = Phaser.Input.Keyboard.JustDown(this.keyEsc);

      if (pad) {
        const axisX = pad.leftStick.x;
        if (axisX < -0.5 || pad.left) { alternarEsq = true; this.inputCooldown = 200; } 
        else if (axisX > 0.5 || pad.right) { alternarDir = true; this.inputCooldown = 200; }
        if (pad.A || (pad.buttons.length > 0 && pad.buttons[0].pressed)) { confirmar = true; }
        if (pad.B || (pad.buttons.length > 1 && pad.buttons[1].pressed)) { cancelar = true; }
      }

      if (alternarEsq || alternarDir) {
        const proximoIndex = this.overlayIndex === 0 ? 1 : 0;
        const ocupado = proximoIndex === 0 ? this.personagensOcupados.solar : this.personagensOcupados.fornalha;
        if (!ocupado) {
          this.overlayIndex = proximoIndex;
          this.atualizarVisualOverlay();
        }
      }

      if (confirmar) {
        const pers = this.overlayIndex === 0 ? "solar" : "fornalha";
        const estaOcupado = this.overlayIndex === 0 ? this.personagensOcupados.solar : this.personagensOcupados.fornalha;
        if (!estaOcupado) this.confirmarSelecao(pers);
      }

      if (cancelar) {
        this.fecharOverlay();
      }

      return;
    }

    if (this.estadoMenu === "SUBMENU_DIARIO") {
      let cancelar = Phaser.Input.Keyboard.JustDown(this.keyEsc);

      if (pad) {
        if (pad.B || (pad.buttons.length > 1 && pad.buttons[1].pressed) || (pad.buttons.length > 8 && pad.buttons[8].pressed)) {
          cancelar = true;
        }
      }

      if (cancelar) {
        this.fecharSubmenuDiario();
        return;
      }

      if (this.inputCooldown <= 0) {
        let moverCima = Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW);
        let moverBaixo = Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS);
        let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);

        if (pad) {
          const axisY = pad.leftStick.y;
          if (axisY < -0.5 || pad.up) { moverCima = true; this.inputCooldown = 200; } 
          else if (axisY > 0.5 || pad.down) { moverBaixo = true; this.inputCooldown = 200; }
          if (pad.A || (pad.buttons.length > 0 && pad.buttons[0].pressed) || (pad.buttons.length > 9 && pad.buttons[9].pressed)) {
            confirmar = true;
          }
        }

        if (moverCima) {
          this.diarioIndex--;
          if (this.diarioIndex < 0) this.diarioIndex = this.opcoesModosDiarios.length - 1;
          this.atualizarSelecaoDiario();
          this.inputCooldown = 180;
        } else if (moverBaixo) {
          this.diarioIndex++;
          if (this.diarioIndex >= this.opcoesModosDiarios.length) this.diarioIndex = 0;
          this.atualizarSelecaoDiario();
          this.inputCooldown = 180;
        }

        if (confirmar) {
          this.confirmarOpcaoDiario();
        }
      }
      return;
    }

    if (this.estadoMenu === "OPTIONS") {
      if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
        this.fecharOpcoes();
        return;
      }

      if (this.inputCooldown <= 0) {
        let moverCima = Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW);
        let moverBaixo = Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS);
        let moverEsq = Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyA);
        let moverDir = Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyD);
        let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);

        if (moverCima) {
          this.opcoesIndex--;
          if (this.opcoesIndex < 0) this.opcoesIndex = 3;
          this.atualizarSelecaoOpcoes();
          this.inputCooldown = 180;
        } else if (moverBaixo) {
          this.opcoesIndex++;
          if (this.opcoesIndex > 3) this.opcoesIndex = 0;
          this.atualizarSelecaoOpcoes();
          this.inputCooldown = 180;
        }

        if (this.opcoesIndex === 0) {
          if (this.keyLeft.isDown || this.keyA.isDown) this.sliderMusica.setValor(this.game.volumeMusica - 0.01);
          if (this.keyRight.isDown || this.keyD.isDown) this.sliderMusica.setValor(this.game.volumeMusica + 0.01);
        } else if (this.opcoesIndex === 1) {
          if (this.keyLeft.isDown || this.keyA.isDown) this.sliderSFX.setValor(this.game.volumeSFX - 0.01);
          if (this.keyRight.isDown || this.keyD.isDown) this.sliderSFX.setValor(this.game.volumeSFX + 0.01);
        } else if (this.opcoesIndex === 2) {
          if (confirmar || moverEsq || moverDir) {
            this.alternarTelaCheia();
            this.inputCooldown = 250;
          }
        } else if (this.opcoesIndex === 3 && confirmar) {
          this.fecharOpcoes();
        }
      }
      return;
    }

    let moverCima = Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW);
    let moverBaixo = Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS);
    let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);

    if (pad) {
      const axisY = pad.leftStick.y;
      if (this.inputCooldown <= 0) {
        if (axisY < -0.5 || pad.up) { moverCima = true; this.inputCooldown = 200; } 
        else if (axisY > 0.5 || pad.down) { moverBaixo = true; this.inputCooldown = 200; }
      }
      if (this.inputCooldown <= 0 && (pad.A || (pad.buttons.length > 9 && pad.buttons[9].pressed))) {
        confirmar = true;
      }
    }

    if (moverCima) {
      this.selectedIndex--;
      if (this.selectedIndex < 0) this.selectedIndex = this.menuOptions.length - 1;
      this.atualizarSelecaoVisual();
    }

    if (moverBaixo) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.menuOptions.length) this.selectedIndex = 0;
      this.atualizarSelecaoVisual();
    }

    if (confirmar) {
      this.menuOptions[this.selectedIndex].action();
    }
  }

  atualizarSelecaoVisual() {
    this.btnObjects.forEach((btnObj, index) => {
      const isSelected = index === this.selectedIndex;

      if (isSelected) {
        btnObj.text.setColor("#ff9900");
        btnObj.text.setText(`> ${this.menuOptions[index].text} <`);

        if (btnObj.container.scaleX !== 1.05) {
          this.tweens.add({ targets: btnObj.container, scaleX: 1.05, scaleY: 1.05, duration: 120, ease: 'Power1' });
        }

        this.tweens.add({
          targets: this.btnHighlightBg,
          y: this.startY + (index * 75),
          alpha: 1,
          duration: 150,
          ease: 'Power1'
        });
      } else {
        btnObj.text.setColor("#666677");
        btnObj.text.setText(this.menuOptions[index].text);

        if (btnObj.container.scaleX !== 1.0) {
          this.tweens.add({ targets: btnObj.container, scaleX: 1.0, scaleY: 1.0, duration: 120, ease: 'Power1' });
        }
      }
    });
  }
}
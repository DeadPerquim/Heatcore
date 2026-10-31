import { Scene } from "phaser";
import { io } from "socket.io-client";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  // ==========================================
  // FUNÇÕES AUXILIARES DE SOM
  // ==========================================
  desbloquearAudioNavegador() {
    if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
      this.sound.context.resume();
    }
  }

  tocarSomMudarOpcao() {
    this.desbloquearAudioNavegador();
    if (this.cache.audio.exists('sfx_mudar_opcao')) {
      const vol = this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7;
      this.sound.play('sfx_mudar_opcao', { volume: vol });
    }
  }

  tocarSomBotaoCurto() {
    this.desbloquearAudioNavegador();
    if (this.cache.audio.exists('sfx_clicar_botao')) {
      const vol = (this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7) * 0.5;
      this.sound.play('sfx_clicar_botao', { volume: vol });
    }
  }

  create() {
    const { width, height } = this.scale;

    // ==========================================
    // 0. CONFIGURAÇÃO GLOBAL DE ÁUDIO & DESBLOQUEIO
    // ==========================================
    if (this.game.volumeMusica === undefined) this.game.volumeMusica = 0.5;
    if (this.game.volumeSFX === undefined) this.game.volumeSFX = 0.7;

    // Garante que qualquer clique ou tecla destrave o áudio no navegador
    this.input.on('pointerdown', () => this.desbloquearAudioNavegador());
    this.input.keyboard.on('keydown', () => this.desbloquearAudioNavegador());

    this.ultimoSelectedIndex = 0;
    this.ultimoOpcoesIndex = 0;

    let somAmbiente = this.sound.get('ambientacao');
    if (somAmbiente && somAmbiente.isPlaying) {
        somAmbiente.stop();
    }

    // ==========================================
    // 0.1 CONEXÃO COM O SERVIDOR
    // ==========================================
    const SERVER_URL = window.location.origin;

    if (!this.game.socket) {
      this.game.socket = io(SERVER_URL);
    }
    this.socket = this.game.socket;

    // ==========================================
    // 1. FUNDO DE LABORATÓRIO E BRILHO
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

    this.add.image(0, 0, 'fundo_lab_pro').setOrigin(0, 0).setDepth(0);

    this.glowAmber = this.add.circle(width * 0.32, height * 0.42, 260, 0xff5500, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);
    this.glowCyan = this.add.circle(width * 0.8, height * 0.7, 220, 0x00f3ff, 0.06)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);

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
    }).setDepth(2);

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
    }).setAlpha(0.6).setDepth(20);

    this.add.text(30, 42, "FACILITY: SUB_LEVEL_02", {
      fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#8888aa"
    }).setAlpha(0.5).setDepth(20);

    this.add.text(width - 30, height - 30, "HEATCORE v1.4.0 - SALAS", {
      fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#8888aa"
    }).setOrigin(1, 1).setAlpha(0.5).setDepth(20);

    let linhaHud = this.add.graphics().setDepth(20);
    linhaHud.lineStyle(1, 0x00f3ff, 0.3);
    linhaHud.lineBetween(30, 60, 220, 60);

    // ==========================================
    // 3. LOGO
    // ==========================================
    this.logoInicialX = width * 0.325;
    this.logoInicialY = height * 0.415;

    this.logoGlow = this.add.circle(this.logoInicialX, this.logoInicialY, 140, 0xff6600, 0.25)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(3);

    this.logo = this.add.image(this.logoInicialX, this.logoInicialY - 50, 'logo_heatcore')
        .setOrigin(0.5)
        .setScale(0.82)
        .setAlpha(0)
        .setDepth(10);

    this.tweens.add({
      targets: [this.logo, this.logoGlow],
      y: this.logoInicialY,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });

    // ==========================================
    // 4. MENU PRINCIPAL DINÂMICO
    // ==========================================
    this.baseMenuX = width * 0.92; 
    this.startY = height * 0.315; 
    
    this.estadoMenu = "MAIN"; // MAIN ou OPTIONS
    this.estadoNavegacao = "PRINCIPAL"; // Qual camada do menu estamos
    this.selectedIndex = 0; 
    
    // Árvore de navegação (Com botão Placar adicionado na raiz PRINCIPAL)
    this.menus = {
      PRINCIPAL: [
        { text: "JOGAR", action: () => this.trocarMenu("TIPO_JOGO") },
        { text: "PLACAR", action: () => this.scene.start("Placar") },
        { text: "OPÇÕES", action: () => this.abrirOpcoes() },
        { text: "CRÉDITOS", action: () => this.irParaCreditos() }
      ],
      TIPO_JOGO: [
        { text: "SINGLEPLAYER", action: () => this.irParaSalas("SINGLEPLAYER") },
        { text: "MULTIPLAYER", action: () => this.trocarMenu("MULTIPLAYER") },
        { text: "> VOLTAR", action: () => this.trocarMenu("PRINCIPAL") }
      ],
      MULTIPLAYER: [
        { text: "CRIAR SALA", action: () => this.irParaSalas("CREATE_ROOM") },
        { text: "PROCURAR SALA", action: () => this.irParaSalas("BROWSER") },
        { text: "ENTRAR POR CÓDIGO", action: () => this.irParaSalas("JOIN_CODE") },
        { text: "> VOLTAR", action: () => this.trocarMenu("TIPO_JOGO") }
      ]
    };

    this.btnHighlightBg = this.add.rectangle(this.baseMenuX + 20, this.startY, 340, 48, 0xff9900, 0.15)
        .setOrigin(1, 0.5)
        .setStrokeStyle(1.5, 0xff9900, 0.8)
        .setAlpha(0)
        .setDepth(15);

    this.containerBotoesMenu = this.add.container(0, 0).setDepth(20);
    this.btnObjects = [];
    
    // Constrói os botões da tela inicial
    this.renderizarBotoes();

    // ==========================================
    // 5. CONTROLES E INPUTS
    // ==========================================
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
    this.inputCooldown = 0; 
    this.ultimoToggleFullscreen = 0;

    this.criarMenuOpcoes();

    this.scale.on('fullscreenchange', () => {
      if (this.toggleFullscreen) this.toggleFullscreen.atualizarVisual();
    });

    document.addEventListener('fullscreenchange', () => {
      if (this.toggleFullscreen) this.toggleFullscreen.atualizarVisual();
    });
  }

  // ==========================================
  // FUNÇÕES DE NAVEGAÇÃO
  // ==========================================

  renderizarBotoes() {
    this.containerBotoesMenu.removeAll(true);
    this.btnObjects = [];
    this.selectedIndex = 0;
    
    const opcoesAtuais = this.menus[this.estadoNavegacao];

    opcoesAtuais.forEach((option, index) => {
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
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(-300, -25, 300, 50), Phaser.Geom.Rectangle.Contains);

      this.tweens.add({
        targets: btnContainer,
        x: this.baseMenuX,
        duration: 400,
        delay: index * 100,
        ease: 'Back.easeOut'
      });

      btnContainer.on('pointerover', () => {
        if (this.estadoMenu === "MAIN") {
          this.selectedIndex = index;
          this.atualizarSelecaoVisual();
        }
      });

      btnContainer.on('pointerdown', () => {
        if (this.estadoMenu === "MAIN") {
          this.tocarSomBotaoCurto();
          option.action();
        }
      });

      this.btnObjects.push({ container: btnContainer, text: btnText, originalText: option.text });
      this.containerBotoesMenu.add(btnContainer);
    });
    
    this.atualizarSelecaoVisual();
  }

  trocarMenu(novoEstado) {
    this.tocarSomMudarOpcao();
    this.estadoNavegacao = novoEstado;
    
    this.tweens.add({
        targets: this.containerBotoesMenu, 
        x: 200, 
        alpha: 0, 
        duration: 200,
        onComplete: () => {
            this.containerBotoesMenu.setX(0);
            this.containerBotoesMenu.setAlpha(1);
            this.renderizarBotoes();
        }
    });
  }

  atualizarSelecaoVisual() {
    if (this.ultimoSelectedIndex !== this.selectedIndex) {
      this.tocarSomMudarOpcao();
      this.ultimoSelectedIndex = this.selectedIndex;
    }

    this.btnObjects.forEach((btnObj, index) => {
      const isSelected = index === this.selectedIndex;

      if (isSelected) {
        btnObj.text.setColor("#ff9900");
        btnObj.text.setText(`> ${btnObj.originalText} <`);

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
        btnObj.text.setText(btnObj.originalText);

        if (btnObj.container.scaleX !== 1.0) {
          this.tweens.add({ targets: btnObj.container, scaleX: 1.0, scaleY: 1.0, duration: 120, ease: 'Power1' });
        }
      }
    });
  }

  irParaSalas(modo) {
    if (this.jaIniciou) return;
    this.jaIniciou = true;
    
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("Salas", { modoInicial: modo });
    });
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
  // MENU DE OPÇÕES (MANTIDO INTACTO)
  // ==========================================
  criarMenuOpcoes() {
    const posX = this.baseMenuX + 350; 

    this.containerOpcoes = this.add.container(posX, this.startY - 30).setAlpha(0).setDepth(20);

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
      this.tocarSomBotaoCurto();
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
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    const estaEmTelaCheia = !!document.fullscreenElement || this.scale.isFullscreen;
    
    const textoStatus = this.add.text(0, 0, estaEmTelaCheia ? "[ X ] ATIVADO" : "[   ] DESATIVADO", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 15,
      color: estaEmTelaCheia ? "#00ff66" : "#8888aa",
      fontStyle: "bold"
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    const acionarToggle = () => {
      this.tocarSomBotaoCurto();
      this.opcoesIndex = 2;
      this.atualizarSelecaoOpcoes();
      onToggle();
    };

    textoRotulo.on('pointerover', () => {
      this.opcoesIndex = 2;
      this.atualizarSelecaoOpcoes();
    });

    textoStatus.on('pointerover', () => {
      this.opcoesIndex = 2;
      this.atualizarSelecaoOpcoes();
    });

    textoRotulo.on('pointerdown', acionarToggle);
    textoStatus.on('pointerdown', acionarToggle);

    container.add([textoRotulo, textoStatus]);

    const funcaoAtualizar = () => {
      setTimeout(() => {
        const ativo = !!document.fullscreenElement || this.scale.isFullscreen;
        textoStatus.setText(ativo ? "[ X ] ATIVADO" : "[   ] DESATIVADO");
        textoStatus.setColor(ativo ? "#00ff66" : "#8888aa");
      }, 80);
    };

    return { container, textoRotulo, textoStatus, atualizarVisual: funcaoAtualizar };
  }

  alternarTelaCheia() {
    const agora = Date.now();
    if (this.ultimoToggleFullscreen && (agora - this.ultimoToggleFullscreen < 400)) {
      return;
    }
    this.ultimoToggleFullscreen = agora;

    const estaEmTelaCheia = !!document.fullscreenElement || this.scale.isFullscreen;

    try {
      if (estaEmTelaCheia) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (this.scale.stopFullscreen) this.scale.stopFullscreen();
      } else {
        if (this.scale.startFullscreen) this.scale.startFullscreen();
      }
    } catch (e) {
      console.warn("Falha ao alternar tela cheia:", e);
    }

    if (this.toggleFullscreen) {
      this.toggleFullscreen.atualizarVisual();
    }
  }

  atualizarSelecaoOpcoes() {
    if (this.ultimoOpcoesIndex !== this.opcoesIndex) {
      this.tocarSomMudarOpcao();
      this.ultimoOpcoesIndex = this.opcoesIndex;
    }

    this.sliderMusica.textoRotulo.setText(this.opcoesIndex === 0 ? "> MÚSICA" : "MÚSICA");
    this.sliderMusica.textoRotulo.setColor(this.opcoesIndex === 0 ? "#ff9900" : "#ffffff");

    this.sliderSFX.textoRotulo.setText(this.opcoesIndex === 1 ? "> EFEITOS SONOROS" : "EFEITOS SONOROS");
    this.sliderSFX.textoRotulo.setColor(this.opcoesIndex === 1 ? "#ff9900" : "#ffffff");

    this.toggleFullscreen.textoRotulo.setText(this.opcoesIndex === 2 ? "> TELA CHEIA" : "TELA CHEIA");
    this.toggleFullscreen.textoRotulo.setColor(this.opcoesIndex === 2 ? "#ff9900" : "#ffffff");

    this.btnVoltarOpcoes.setText(this.opcoesIndex === 3 ? "> [ VOLTAR ] <" : "[ VOLTAR ]");
    this.btnVoltarOpcoes.setColor(this.opcoesIndex === 3 ? "#ff9900" : "#666677");
  }

  abrirOpcoes() {
    if (this.estadoMenu === "OPTIONS") return;
    this.estadoMenu = "OPTIONS";
    this.inputCooldown = 250;
    this.opcoesIndex = 0;
    this.ultimoOpcoesIndex = 0;
    
    if (this.toggleFullscreen) this.toggleFullscreen.atualizarVisual();
    this.atualizarSelecaoOpcoes();

    this.tweens.add({ targets: this.btnHighlightBg, alpha: 0, duration: 150 });
    this.tweens.add({ targets: this.containerBotoesMenu, x: 350, alpha: 0, duration: 350, ease: 'Back.easeIn' });
    this.tweens.add({ targets: this.containerOpcoes, x: this.baseMenuX, alpha: 1, duration: 400, delay: 150, ease: 'Back.easeOut' });
  }

  fecharOpcoes() {
    if (this.estadoMenu === "MAIN") return;
    this.estadoMenu = "MAIN";
    this.inputCooldown = 250;

    this.tweens.add({ targets: this.containerOpcoes, x: this.baseMenuX + 350, alpha: 0, duration: 300, ease: 'Back.easeIn' });
    this.tweens.add({
      targets: this.containerBotoesMenu, x: 0, alpha: 1, duration: 400, delay: 100, ease: 'Back.easeOut',
      onComplete: () => { this.atualizarSelecaoVisual(); }
    });
  }

  // ==========================================
  // UPDATE LOOP (CONTROLES E PARALLAX)
  // ==========================================
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
    
    const pad = this.input.gamepad ? (this.input.gamepad.pad1 || this.input.gamepad.getPad(0)) : null;

    const isBtnPressed = (padObj, buttonIndex) => {
      if (padObj && padObj.buttons && padObj.buttons[buttonIndex]) {
        if (padObj.buttons[buttonIndex].pressed || padObj.buttons[buttonIndex].value > 0.5) return true;
      }
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const rawPads = navigator.getGamepads();
        for (let i = 0; i < rawPads.length; i++) {
          const rp = rawPads[i];
          if (rp && rp.buttons && rp.buttons[buttonIndex] && (rp.buttons[buttonIndex].pressed || rp.buttons[buttonIndex].value > 0.5)) {
            return true;
          }
        }
      }
      return false;
    };

    if (this.estadoMenu === "OPTIONS") {
      let cancelar = Phaser.Input.Keyboard.JustDown(this.keyEsc);

      if (this.inputCooldown <= 0 && (isBtnPressed(pad, 1) || isBtnPressed(pad, 8))) {
        cancelar = true;
      }

      if (cancelar) {
        this.tocarSomBotaoCurto();
        this.fecharOpcoes();
        return;
      }

      if (this.inputCooldown <= 0) {
        let moverCima = Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW);
        let moverBaixo = Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS);
        let moverEsq = Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyA);
        let moverDir = Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyD);
        let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);

        const axisY = pad && pad.leftStick ? pad.leftStick.y : 0;
        const axisX = pad && pad.leftStick ? pad.leftStick.x : 0;

        if (axisY < -0.5 || (pad && pad.up) || isBtnPressed(pad, 12)) { moverCima = true; this.inputCooldown = 200; } 
        else if (axisY > 0.5 || (pad && pad.down) || isBtnPressed(pad, 13)) { moverBaixo = true; this.inputCooldown = 200; }

        if (axisX < -0.5 || (pad && pad.left) || isBtnPressed(pad, 14)) moverEsq = true;
        else if (axisX > 0.5 || (pad && pad.right) || isBtnPressed(pad, 15)) moverDir = true;
        
        if (isBtnPressed(pad, 2) || isBtnPressed(pad, 0) || isBtnPressed(pad, 3) || isBtnPressed(pad, 9) || (pad && pad.A)) {
          confirmar = true;
        }

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
          if (this.keyLeft.isDown || this.keyA.isDown || moverEsq) this.sliderMusica.setValor(this.game.volumeMusica - 0.01);
          if (this.keyRight.isDown || this.keyD.isDown || moverDir) this.sliderMusica.setValor(this.game.volumeMusica + 0.01);
        } else if (this.opcoesIndex === 1) {
          if (this.keyLeft.isDown || this.keyA.isDown || moverEsq) this.sliderSFX.setValor(this.game.volumeSFX - 0.01);
          if (this.keyRight.isDown || this.keyD.isDown || moverDir) this.sliderSFX.setValor(this.game.volumeSFX + 0.01);
        } else if (this.opcoesIndex === 2) {
          if (confirmar || moverEsq || moverDir) {
            this.tocarSomBotaoCurto();
            this.alternarTelaCheia();
            this.inputCooldown = 250;
          }
        } else if (this.opcoesIndex === 3 && confirmar) {
          this.tocarSomBotaoCurto();
          this.fecharOpcoes();
        }
      }
      return;
    }

    // NAVEGAÇÃO DOS MENUS PRINCIPAIS
    let moverCima = Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW);
    let moverBaixo = Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS);
    let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);
    let cancelar = Phaser.Input.Keyboard.JustDown(this.keyEsc);

    const axisY = pad && pad.leftStick ? pad.leftStick.y : 0;
    
    if (this.inputCooldown <= 0) {
      if (axisY < -0.5 || (pad && pad.up) || isBtnPressed(pad, 12)) { moverCima = true; this.inputCooldown = 200; } 
      else if (axisY > 0.5 || (pad && pad.down) || isBtnPressed(pad, 13)) { moverBaixo = true; this.inputCooldown = 200; }
      
      if (isBtnPressed(pad, 1) || isBtnPressed(pad, 8)) { cancelar = true; }
    }
    
    if (this.inputCooldown <= 0 && (isBtnPressed(pad, 0) || isBtnPressed(pad, 2) || isBtnPressed(pad, 9) || (pad && pad.A))) {
      confirmar = true;
    }

    // Permitir voltar menus pelo botão ESC / Bolinha / B
    if (cancelar) {
        if (this.estadoNavegacao === "TIPO_JOGO") this.trocarMenu("PRINCIPAL");
        else if (this.estadoNavegacao === "MULTIPLAYER") this.trocarMenu("TIPO_JOGO");
        this.inputCooldown = 200;
    }

    const maxOpcoes = this.menus[this.estadoNavegacao].length;

    if (moverCima) {
      this.selectedIndex--;
      if (this.selectedIndex < 0) this.selectedIndex = maxOpcoes - 1;
      this.atualizarSelecaoVisual();
    }

    if (moverBaixo) {
      this.selectedIndex++;
      if (this.selectedIndex >= maxOpcoes) this.selectedIndex = 0;
      this.atualizarSelecaoVisual();
    }

    if (confirmar) {
      this.tocarSomBotaoCurto();
      this.menus[this.estadoNavegacao][this.selectedIndex].action();
      this.inputCooldown = 200;
    }
  }
}
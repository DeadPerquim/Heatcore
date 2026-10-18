import { Scene } from "phaser";
import { io } from "socket.io-client";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    // ==========================================
    // 0. CONEXÃO COM O SERVIDOR MULTIPLAYER
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

    // Escuta atualizações do servidor em tempo real
    this.socket.on('estadoPersonagens', (estado) => {
      this.personagensOcupados.solar = !!estado.solar && estado.solar !== this.socket.id;
      this.personagensOcupados.fornalha = !!estado.fornalha && estado.fornalha !== this.socket.id;
      
      // Se o personagem atualmente destacado ficou ocupado por outro, alterna para o livre
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
    // 1. FUNDO E ATMOSFERA
    // ==========================================
    let bgGraphics = this.make.graphics({ add: false });
    bgGraphics.fillStyle(0x15151c, 1); 
    bgGraphics.fillRect(0, 0, width, height); 
    bgGraphics.generateTexture('fundo_profissional', width, height);
    this.add.image(0, 0, 'fundo_profissional').setOrigin(0, 0);

    let vinheta = this.add.graphics();
    vinheta.fillStyle(0x000000, 0.4);
    vinheta.fillRect(0, 0, width, height);
    vinheta.setBlendMode(Phaser.BlendModes.MULTIPLY);

    if (this.cache.audio.exists('menu')) {
        if (!this.sound.get('menu')) {
            this.musicaMenu = this.sound.add('menu', {
                loop: true,
                volume: 0.4
            });
            this.musicaMenu.play();
        } else {
            this.musicaMenu = this.sound.get('menu');
            if (!this.musicaMenu.isPlaying) {
                this.musicaMenu.play();
            }
        }
    }

    // ==========================================
    // 2. LOGO
    // ==========================================
    this.logoInicialX = width * 0.325;
    this.logoInicialY = height * 0.415;

    this.logo = this.add.image(this.logoInicialX, this.logoInicialY - 50, 'logo_heatcore')
        .setOrigin(0.5)
        .setScale(0.80)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: this.logo,
      y: this.logoInicialY,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });

    // ==========================================
    // 3. SISTEMA DE MENU
    // ==========================================
    let startY = height * 0.315; 
    let baseMenuX = width * 0.95; 
    
    this.menuOptions = [
      { text: "JOGAR", action: () => this.abrirSelecaoPersonagem("Mapa2") },
      { text: "MAPA DIÁRIO", action: () => this.abrirSelecaoPersonagem("Diario") },
      { text: "OPÇÕES", action: () => console.log("Opções selecionadas") },
      { text: "CRÉDITOS", action: () => console.log("Créditos selecionados") }
    ];

    this.selectedIndex = 0; 
    this.btnObjects = [];

    this.menuOptions.forEach((option, index) => {
      let btn = this.add.text(baseMenuX + 100, startY + (index * 75), option.text, {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 30,
        color: index === 0 ? "#ff9900" : "#888888",
        fontStyle: "bold",
        align: "right",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
      })
      .setOrigin(1, 0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true }); 

      this.tweens.add({
        targets: btn,
        x: baseMenuX,
        alpha: 1,
        duration: 800,
        delay: 300 + (index * 150),
        ease: 'Back.easeOut'
      });

      btn.on('pointerover', () => {
        if (!this.overlayAtivo) {
          this.selectedIndex = index;
          this.atualizarSelecaoVisual();
        }
      });

      btn.on('pointerdown', () => {
        if (!this.overlayAtivo) {
          option.action();
        }
      });

      this.btnObjects.push(btn);
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

    // ==========================================
    // 4. OVERLAY DINÂMICO DE SELEÇÃO
    // ==========================================
    this.criarOverlayPersonagens();
  }

  criarOverlayPersonagens() {
    const { width, height } = this.scale;
    const cX = width / 2;
    const cY = height / 2;

    this.overlayContainer = this.add.container(0, 0).setDepth(500).setVisible(false);

    this.fundoEscuro = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
        .setOrigin(0, 0)
        .setInteractive();

    this.painelGroup = this.add.container(cX, cY);

    const painelLargura = Math.min(500, width * 0.9);
    const painelAltura = Math.min(310, height * 0.85);

    const painel = this.add.rectangle(0, 0, painelLargura, painelAltura, 0x111118)
        .setStrokeStyle(3, 0xff9900);

    const titulo = this.add.text(0, -(painelAltura * 0.36), "ESCOLHA SEU PERSONAGEM", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 20,
      color: "#ff9900",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    this.cardSolar = this.criarCardPersonagem(-105, -10, "SOLAR", "preview_solar", () => {
      if (this.inputCooldown <= 0 && !this.personagensOcupados.solar) this.confirmarSelecao("solar");
    });

    this.cardFornalha = this.criarCardPersonagem(105, -10, "FORNALHA", "preview_fornalha", () => {
      if (this.inputCooldown <= 0 && !this.personagensOcupados.fornalha) this.confirmarSelecao("fornalha");
    });

    this.btnCancelarOverlay = this.add.text(0, painelAltura * 0.38, "[ ESC / VOLTAR ]", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 14,
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.btnCancelarOverlay.on('pointerdown', () => {
      if (this.inputCooldown <= 0) this.fecharOverlay();
    });

    this.painelGroup.add([
      painel,
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

  criarCardPersonagem(x, y, nome, chaveImagem, onSelect) {
    const containerCard = this.add.container(x, y);

    const bgCard = this.add.rectangle(0, 0, 170, 170, 0x22222c)
        .setStrokeStyle(2, 0x555555)
        .setInteractive({ useHandCursor: true });

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

      spritePreview = this.add.image(0, -15, 'Personagens', frameKey).setDisplaySize(80, 80);
    } else {
      spritePreview = this.add.rectangle(0, -15, 80, 80, 0x333344).setStrokeStyle(1, 0x666688);
    }

    const textoNome = this.add.text(0, 45, nome, {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 16,
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const textoOcupado = this.add.text(0, 63, "SELECIONADO", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 11,
      color: "#ff3333",
      fontStyle: "bold"
    }).setOrigin(0.5).setVisible(false);

    bgCard.on('pointerover', () => {
      if (this.overlayAtivo) {
        const targetIndex = (nome === "SOLAR") ? 0 : 1;
        const estaOcupado = (targetIndex === 0) ? this.personagensOcupados.solar : this.personagensOcupados.fornalha;
        if (!estaOcupado) {
          this.overlayIndex = targetIndex;
          this.atualizarSelecaoVisual();
        }
      }
    });

    bgCard.on('pointerdown', onSelect);

    containerCard.add([bgCard, spritePreview, textoNome, textoOcupado]);

    return { container: containerCard, bgCard: bgCard, textoNome: textoNome, textoOcupado: textoOcupado, spritePreview: spritePreview };
  }

  abrirSelecaoPersonagem(cenaDestino) {
    this.cenaDestino = cenaDestino;
    this.overlayAtivo = true;
    
    // Escolhe automaticamente o primeiro disponível
    this.overlayIndex = this.personagensOcupados.solar ? 1 : 0;
    this.inputCooldown = 350; 
    
    this.overlayContainer.setVisible(true);
    this.atualizarVisualOverlay();

    this.fundoEscuro.setAlpha(0);
    this.painelGroup.setAlpha(0).setScale(0.75);

    this.tweens.add({ targets: this.fundoEscuro, alpha: 0.8, duration: 200, ease: 'Linear' });
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
    // SOLAR
    if (this.personagensOcupados.solar) {
      this.cardSolar.bgCard.setStrokeStyle(2, 0x333333).setFillStyle(0x111115);
      this.cardSolar.textoNome.setColor("#555555");
      this.cardSolar.spritePreview.setAlpha(0.3);
      this.cardSolar.textoOcupado.setVisible(true);
    } else if (this.overlayIndex === 0) {
      this.cardSolar.bgCard.setStrokeStyle(3, 0xff9900).setFillStyle(0x333344);
      this.cardSolar.textoNome.setColor("#ff9900");
      this.cardSolar.spritePreview.setAlpha(1);
      this.cardSolar.textoOcupado.setVisible(false);
    } else {
      this.cardSolar.bgCard.setStrokeStyle(2, 0x555555).setFillStyle(0x22222c);
      this.cardSolar.textoNome.setColor("#ffffff");
      this.cardSolar.spritePreview.setAlpha(1);
      this.cardSolar.textoOcupado.setVisible(false);
    }

    // FORNALHA
    if (this.personagensOcupados.fornalha) {
      this.cardFornalha.bgCard.setStrokeStyle(2, 0x333333).setFillStyle(0x111115);
      this.cardFornalha.textoNome.setColor("#555555");
      this.cardFornalha.spritePreview.setAlpha(0.3);
      this.cardFornalha.textoOcupado.setVisible(true);
    } else if (this.overlayIndex === 1) {
      this.cardFornalha.bgCard.setStrokeStyle(3, 0xff9900).setFillStyle(0x333344);
      this.cardFornalha.textoNome.setColor("#ff9900");
      this.cardFornalha.spritePreview.setAlpha(1);
      this.cardFornalha.textoOcupado.setVisible(false);
    } else {
      this.cardFornalha.bgCard.setStrokeStyle(2, 0x555555).setFillStyle(0x22222c);
      this.cardFornalha.textoNome.setColor("#ffffff");
      this.cardFornalha.spritePreview.setAlpha(1);
      this.cardFornalha.textoOcupado.setVisible(false);
    }
  }

  confirmarSelecao(personagemEscolhido) {
    if (this.jaIniciou) return;
    
    // 🛡️ BLINDA A IDENTIDADE GLOBAL NA SESSÃO DO JOGO
    this.game.meuPersonagem = personagemEscolhido;

    // Solicita ao servidor reservar o personagem
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
        // 🎵 Para a música do menu instantaneamente ao iniciar a transição
        if (this.musicaMenu) {
            this.musicaMenu.stop();
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.stop();
          this.scene.start(this.cenaDestino, {
            personagem: personagemEscolhido,
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
    let deslocamentoX = (ponteiro.x - this.logoInicialX) / 30;
    let deslocamentoY = (ponteiro.y - this.logoInicialY) / 40;

    this.logo.x = this.logoInicialX + deslocamentoX;
    this.logo.y = this.logoInicialY + deslocamentoY;
    this.logo.rotation = deslocamentoX * 0.003;

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
    this.btnObjects.forEach((btn, index) => {
      if (index === this.selectedIndex) {
        btn.setColor("#ff9900"); 
        if (btn.scaleX !== 1.1) {
          this.tweens.add({ targets: btn, scaleX: 1.1, scaleY: 1.1, duration: 100, ease: 'Power1' });
        }
      } else {
        btn.setColor("#888888"); 
        if (btn.scaleX !== 1.0) {
          this.tweens.add({ targets: btn, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Power1' });
        }
      }
    });
  }
}
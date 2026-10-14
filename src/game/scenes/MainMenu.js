import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    // ==========================================
    // 1. FUNDO E ATMOSFERA PROFISSIONAL
    // ==========================================
    let bgGraphics = this.make.graphics({ add: false });
    bgGraphics.fillStyle(0x15151c, 1); // Tom mais escuro e cinematográfico
    bgGraphics.fillRect(0, 0, 800, 600); 
    bgGraphics.generateTexture('fundo_profissional', 800, 600);
    this.add.image(0, 0, 'fundo_profissional').setOrigin(0, 0);

    // Vinheta escura nas bordas para focar a atenção no centro
    let vinheta = this.add.graphics();
    vinheta.fillStyle(0x000000, 0.4);
    vinheta.fillRect(0, 0, 800, 600);
    vinheta.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // ==========================================
    // 2. LOGO OFICIAL COM ENTRADA SUAVE E 3D
    // ==========================================
    this.logoInicialX = 260;
    this.logoInicialY = 250;

    this.logo = this.add.image(this.logoInicialX, this.logoInicialY - 50, 'logo_heatcore')
        .setOrigin(0.5)
        .setScale(0.80)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);

    // Animação de Surgimento (Fade in + Descida elegante)
    this.tweens.add({
      targets: this.logo,
      y: this.logoInicialY,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });

    // ==========================================
    // 3. SISTEMA DE MENU COM SELEÇÃO (TECLADO + CONTROLE)
    // ==========================================
    let startY = 190; 
    let baseMenuX = 760; 
    
    this.menuOptions = [
      { text: "JOGAR", action: () => this.iniciarJogo() },
      { text: "MAPA DIÁRIO", action: () => this.irParaMapaDiario() },
      { text: "OPÇÕES", action: () => console.log("Opções selecionadas") },
      { text: "CRÉDITOS", action: () => console.log("Créditos selecionados") }
    ];

    this.selectedIndex = 0; // Índice da opção atualmente selecionada
    this.btnObjects = [];

    this.menuOptions.forEach((option, index) => {
      let btn = this.add.text(baseMenuX + 100, startY + (index * 75), option.text, {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 30,
        color: index === 0 ? "#ff9900" : "#888888", // O primeiro começa selecionado
        fontStyle: "bold",
        align: "right",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
      })
      .setOrigin(1, 0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true }); 

      // Animação de entrada dos botões da direita para a esquerda
      this.tweens.add({
        targets: btn,
        x: baseMenuX,
        alpha: 1,
        duration: 800,
        delay: 300 + (index * 150),
        ease: 'Back.easeOut'
      });

      // Evento de Mouse Hover
      btn.on('pointerover', () => {
        this.selectedIndex = index;
        this.atualizarSelecaoVisual();
      });

      // Evento de Clique
      btn.on('pointerdown', () => {
        option.action();
      });

      this.btnObjects.push(btn);
    });

    // Configuração de Teclas de Navegação (Setas do Teclado + W/S)
    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.jaIniciou = false;
    this.inputCooldown = 0; // Evita que o analógico passe pelas opções rápido demais
  }

  update(time, delta) {
    // ==========================================
    // 4. EFEITO 3D / PARALAXE DA LOGO
    // ==========================================
    const ponteiro = this.input.activePointer;
    let deslocamentoX = (ponteiro.x - this.logoInicialX) / 30;
    let deslocamentoY = (ponteiro.y - this.logoInicialY) / 40;

    this.logo.x = this.logoInicialX + deslocamentoX;
    this.logo.y = this.logoInicialY + deslocamentoY;
    this.logo.rotation = deslocamentoX * 0.003;

    if (this.jaIniciou) return;

    // ==========================================
    // 5. NAVEGAÇÃO POR TECLADO E GAMEPAD
    // ==========================================
    this.inputCooldown -= delta;

    const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
    let moverCima = Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW);
    let moverBaixo = Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS);
    let confirmar = Phaser.Input.Keyboard.JustDown(this.keyEnter);

    if (pad) {
        // Navegação pelo D-Pad ou analógico esquerdo com cooldown para fluidez
        const axisY = pad.leftStick.y;
        if (this.inputCooldown <= 0) {
            if (axisY < -0.5 || pad.up) {
                moverCima = true;
                this.inputCooldown = 200; // milissegundos de pausa entre toques
            } else if (axisY > 0.5 || pad.down) {
                moverBaixo = true;
                this.inputCooldown = 200;
            }
        }
        if (pad.A || (pad.buttons.length > 9 && pad.buttons[9].pressed)) {
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

  // Atualiza as cores e tamanhos visualmente com base na opção selecionada
  atualizarSelecaoVisual() {
    this.btnObjects.forEach((btn, index) => {
        if (index === this.selectedIndex) {
            btn.setColor("#ff9900"); // Laranja de destaque
            if (btn.scaleX !== 1.1) {
                this.tweens.add({
                    targets: btn,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100,
                    ease: 'Power1'
                });
            }
        } else {
            btn.setColor("#888888"); // Cinza inativo
            if (btn.scaleX !== 1.0) {
                this.tweens.add({
                    targets: btn,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 100,
                    ease: 'Power1'
                });
            }
        }
    });
  }

  iniciarJogo() {
    if (this.jaIniciou) return;
    this.jaIniciou = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop();
        this.scene.start("Game");
    });
  }

  irParaMapaDiario() {
    if (this.jaIniciou) return;
    this.jaIniciou = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop();
        this.scene.start("Diario");
    });
  }
}
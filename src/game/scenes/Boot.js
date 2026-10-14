import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    let bgGraphics = this.make.graphics({ add: false });
    bgGraphics.fillStyle(0x2a2a35, 1);
    bgGraphics.fillRect(0, 0, 800, 600);
    bgGraphics.generateTexture('fundo_temporario', 800, 600);

    let titleGraphics = this.make.graphics({ add: false });
    titleGraphics.fillStyle(0xff5500, 1);
    titleGraphics.fillRect(0, 0, 350, 120);
    titleGraphics.generateTexture('titulo_temporario', 350, 120);
  }

  create() {
    // 1. FUNDO PRETO
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0, 0);
    this.jaFoiProMenu = false;

    // ==========================================
    // 2. EFEITOS DE MONITOR CRT / VHS
    // ==========================================

    // Gerador de Scanlines (Linhas horizontais escuras)
    let linhasTV = this.make.graphics({ add: false });
    linhasTV.fillStyle(0x000000, 0.4); // Preto com 40% de opacidade
    for (let i = 0; i < 600; i += 4) {
        linhasTV.fillRect(0, i, 800, 2);
    }
    linhasTV.generateTexture('scanlines', 800, 600);

    // ==========================================
    // 3. TEXTO COM BRILHO NEON (GLOW)
    // ==========================================
    const linhasDoTerminal = [
      "Iniciando HEATCORE OS v1.0.4...",
      "Carregando modulos de memoria......... [OK]",
      "Conectando ao servidor central........ [OK]",
      "Verificando arquivos do Tiled (JSON).. [OK]",
      "Injetando matrizes de colisao física.. [OK]",
      "Despertando entidades: Solar.......... [OK]",
      "Despertando entidades: Fornalha....... [OK]",
      "Compilando renderizador 2D............ [OK]",
      "Acesso concedido. Abrindo interface."
    ];

    let consoleText = this.add.text(40, 40, "", {
      fontFamily: "'Courier New', Courier, monospace", 
      fontSize: 18,
      color: "#66ff66", // Verde mais claro no centro
      align: "left",
      // O truque do brilho do monitor antigo:
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 6, fill: true } 
    });

    // ==========================================
    // 4. APLICANDO AS CAMADAS VISUAIS (OVERLAYS)
    // ==========================================
    // Coloca as scanlines por cima de tudo (Depth 10)
    this.add.image(0, 0, 'scanlines').setOrigin(0, 0).setDepth(10);

    // Efeito Flicker (Tela piscando sutilmente)
    let crtFlicker = this.add.rectangle(0, 0, 800, 600, 0x00ff00, 0.02).setOrigin(0, 0).setDepth(11);
    this.tweens.add({
        targets: crtFlicker,
        alpha: 0.05,
        duration: 70,
        yoyo: true,
        repeat: -1
    });

    // Efeito de falha VHS (Micro tremidas horizontais aleatórias)
    this.time.addEvent({
        delay: 1200,
        loop: true,
        callback: () => {
            if (Math.random() > 0.6 && !this.jaFoiProMenu) {
                consoleText.x = 43; // Dá um "pulo" para o lado
                this.time.delayedCall(60, () => { consoleText.x = 40; }); // Volta na mesma hora
            }
        }
    });

    // ==========================================
    // 5. LÓGICA DE DIGITAÇÃO DO TERMINAL
    // ==========================================
    let linhaAtual = 0;
    let textoAcumulado = "";

    this.time.addEvent({
      delay: 250, 
      repeat: linhasDoTerminal.length - 1,
      callback: () => {
        if (this.jaFoiProMenu) return; 

        textoAcumulado += linhasDoTerminal[linhaAtual] + "\n";
        consoleText.setText(textoAcumulado);
        linhaAtual++;

        if (linhaAtual === linhasDoTerminal.length) {
          this.time.delayedCall(500, () => {
            this.irParaMenu();
          });
        }
      }
    });

    // Sistema de Pular (Skip)
    this.input.once("pointerdown", () => this.irParaMenu());
    this.input.keyboard.once("keydown-ENTER", () => this.irParaMenu());
  }

  update() {
    const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
    if (pad && !this.jaFoiProMenu) {
        if (pad.A || (pad.buttons.length > 9 && pad.buttons[9].pressed)) {
            this.irParaMenu();
        }
    }
  }

  irParaMenu() {
    if (this.jaFoiProMenu) return;
    this.jaFoiProMenu = true;

    this.scene.launch("MainMenu");
    this.scene.bringToTop("Boot");

    this.tweens.add({
        targets: this.cameras.main,
        alpha: 0, 
        duration: 1500, 
        ease: 'Power2',
        onComplete: () => {
            this.scene.stop("Boot");
        }
    });
  }
}
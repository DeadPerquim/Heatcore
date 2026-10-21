import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.audio('boot_pc', 'assets/audio/sfx/Old_90s_PC_boot_sequence.wav');

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
    // 1. FUNDO PRETO TIPO MONITOR ANTIGO
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0, 0);
    this.jaFoiProMenu = false;
    this.sistemaIniciado = false;
    this.podePularBios = false;
    this.podePularComControle = false;

    // ==========================================
    // 2. TELA DE ESPERA (DESBLOQUEIO DE ÁUDIO)
    // ==========================================
    let avisoTexto = this.add.text(400, 300, "> PRESSIONE QUALQUER TECLA, CLIQUE OU BOTÃO PARA LIGAR <", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 14,
      color: "#00ff00",
      align: "center"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: avisoTexto,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Função central para ligar o sistema com apenas 1 toque
    const ligarSistema = () => {
      if (this.sistemaIniciado) return;
      this.sistemaIniciado = true;

      avisoTexto.destroy();

      if (this.cache.audio.exists('boot_pc')) {
          this.sound.play('boot_pc', { volume: 0.7 });
      }

      this.iniciarBios();

      // Ativa a permissão para pular a BIOS após 250ms
      this.time.delayedCall(250, () => {
          this.podePularBios = true;
      });
    };

    this.ligarSistema = ligarSistema;

    // Ouvintes diretos de clique único para Rato e Teclado
    this.input.once("pointerdown", ligarSistema);
    this.input.keyboard.once("keydown", ligarSistema);
  }

  update() {
    if (this.jaFoiProMenu) return;

    // Verifica o estado do Gamepad (incluindo controles genéricos USB SNES)
    const pad = this.input.gamepad ? (this.input.gamepad.pad1 || this.input.gamepad.getPad(0)) : null;
    const padPressed = pad && (
        pad.buttons.some(b => b && (b.pressed || b.value > 0.5)) ||
        (pad.leftStick && (Math.abs(pad.leftStick.x) > 0.3 || Math.abs(pad.leftStick.y) > 0.3))
    );

    // 1. TELA INICIAL: Liga o sistema IMEDIATAMENTE no primeiro toque do controle
    if (!this.sistemaIniciado) {
        if (padPressed) {
            this.ligarSistema();
        }
        return;
    }

    // 2. TELA DA BIOS: Garante que o jogador SOLTOU o botão antes de aceitar um novo toque para pular
    if (this.sistemaIniciado && !this.podePularComControle) {
        if (!padPressed) {
            this.podePularComControle = true; // Botão de ligar foi solto!
        }
    } else if (this.sistemaIniciado && this.podePularComControle && this.podePularBios) {
        if (padPressed) {
            this.irParaPreloader();
        }
    }
  }

  iniciarBios() {
    let linhasTV = this.make.graphics({ add: false });
    linhasTV.fillStyle(0x000000, 0.4); 
    for (let i = 0; i < 600; i += 4) {
        linhasTV.fillRect(0, i, 800, 2);
    }
    linhasTV.generateTexture('scanlines', 800, 600);
    this.add.image(0, 0, 'scanlines').setOrigin(0, 0).setDepth(10);

    let crtFlicker = this.add.rectangle(0, 0, 800, 600, 0x00ff00, 0.015).setOrigin(0, 0).setDepth(11);
    this.tweens.add({
        targets: crtFlicker,
        alpha: 0.04,
        duration: 70,
        yoyo: true,
        repeat: -1
    });

    const linhasDoTerminal = [
      "Award Modular BIOS v4.51PG, An Energy Star Ally",
      "Copyright (C) 2042-56, Award Software, Inc.",
      "",
      "PENTIUM-S CPU at 1260MHz (Overclocked to 18200MHz)",
      "Memory Test :  640GB OK",
      "",
      "Award Plug and Play BIOS Extension v1.0A",
      "Detecting IDE Primary Master  ... Heatcore_SSD [OK]",
      "Detecting IDE Primary Slave   ... [None]",
      "Detecting IDE Secondary Master... Solar_Mod.iso [OK]",
      "Detecting IDE Secondary Slave ... Fornalha_Engine.pak [OK]",
      "",
      "Initializing USB Controllers... [OK]",
      "Verifying DMI Pool Data....................... SUCCESS",
      "Allocating DMA channels for Audio Mixer....... [OK]",
      "Mounting Tiled JSON Maps & Spritesheets....... [OK]",
      "",
      "Press DEL to enter SETUP",
      "20/11/2026-i430VX-UMC8669-2A59GH2BC-00",
      "",
      "SYSTEM BOOT SUCCESSFUL. LOADING INTERFACE..."
    ];

    let consoleText = this.add.text(40, 30, "", {
      fontFamily: "'Courier New', Courier, monospace", 
      fontSize: 15,
      color: "#00ff00", 
      align: "left",
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 4, fill: true } 
    });

    this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => {
            if (Math.random() > 0.6 && !this.jaFoiProMenu) {
                consoleText.x = 43; 
                this.time.delayedCall(50, () => { consoleText.x = 40; }); 
            }
        }
    });

    let linhaAtual = 0;
    let textoAcumulado = "";

    this.time.addEvent({
      delay: 120, 
      repeat: linhasDoTerminal.length - 1,
      callback: () => {
        if (this.jaFoiProMenu) return; 

        textoAcumulado += linhasDoTerminal[linhaAtual] + "\n";
        consoleText.setText(textoAcumulado + "_");
        linhaAtual++;

        if (linhaAtual === linhasDoTerminal.length) {
          this.time.delayedCall(900, () => {
            this.irParaPreloader();
          });
        }
      }
    });

    // Permite pular a BIOS com novo clique ou tecla do teclado
    this.time.delayedCall(250, () => {
        this.input.on("pointerdown", () => {
            if (this.podePularBios && !this.jaFoiProMenu) this.irParaPreloader();
        });
        this.input.keyboard.on("keydown", () => {
            if (this.podePularBios && !this.jaFoiProMenu) this.irParaPreloader();
        });
    });
  }

  irParaPreloader() {
    if (this.jaFoiProMenu) return;
    this.jaFoiProMenu = true;

    try {
        this.sound.stopByKey('boot_pc');
    } catch (e) {}

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop("Boot");
        this.scene.start("Preloader");
    });
  }
}
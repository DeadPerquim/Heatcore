import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Mantém o áudio original, pois o som mecânico/eletrônico ainda serve bem para dar "start"
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

    this.jaFoiProMenu = false;
    this.sistemaIniciado = false;
    this.podePularBios = false;
    this.podePularComControle = false;

    // ==========================================
    // 2. TELA DE ESPERA (DESBLOQUEIO DE ÁUDIO)
    // ==========================================
    let avisoTexto = this.add.text(cX, cY, "SYS_STANDBY // AWAITING ACTIVATION SIGNAL...", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 16,
      color: "#00f3ff",
      align: "center",
      shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 8, fill: true } 
    }).setOrigin(0.5).setDepth(5);

    let subTexto = this.add.text(cX, cY + 30, "[ PRESSIONE QUALQUER TECLA OU BOTÃO PARA INICIAR ]", {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 12,
        color: "#8888aa",
        align: "center"
    }).setOrigin(0.5).setDepth(5);

    this.tweens.add({
      targets: avisoTexto,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // ==========================================
    // 3. ANIMAÇÃO DE MONITOR LIGANDO AO CARREGAR
    // ==========================================
    this.crtFundo = this.add.rectangle(cX, cY, width, height, 0x000000).setDepth(1000);
    this.crtLinha = this.add.rectangle(cX, cY, width, 4, 0xffffff).setDepth(1001).setScale(0, 1);

    // Expande no eixo X
    this.tweens.add({
        targets: this.crtLinha,
        scaleX: 1,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
            // Expande no eixo Y e revela o conteúdo por trás
            this.tweens.add({
                targets: this.crtLinha,
                scaleY: height / 2,
                alpha: 0,
                duration: 250,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: this.crtFundo,
                alpha: 0,
                duration: 250,
                ease: 'Power2'
            });
        }
    });

    // ==========================================
    // 4. LÓGICA DE ATIVAÇÃO DO SISTEMA
    // ==========================================
    const ligarSistema = () => {
      if (this.sistemaIniciado) return;
      this.sistemaIniciado = true;

      avisoTexto.destroy();
      subTexto.destroy();

      if (this.cache.audio.exists('boot_pc')) {
          this.sound.play('boot_pc', { volume: 0.7 });
      }

      this.iniciarBios();

      // Ativa a permissão para pular o boot moderno após 250ms
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

    // Verifica o estado do Gamepad (incluindo controles genéricos USB SNES e XInput)
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
    const width = this.scale.width || 800;
    const height = this.scale.height || 600;

    // Efeito sutil de scanlines modernas no HUD
    let linhasTV = this.make.graphics({ add: false });
    linhasTV.fillStyle(0x000000, 0.15); 
    for (let i = 0; i < height; i += 4) {
        linhasTV.fillRect(0, i, width, 2);
    }
    linhasTV.generateTexture('scanlines_modernas', width, height);
    this.add.image(0, 0, 'scanlines_modernas').setOrigin(0, 0).setDepth(10);

    // Cintilação Azul Cyan de Sistema
    let crtFlicker = this.add.rectangle(0, 0, width, height, 0x00f3ff, 0.02).setOrigin(0, 0).setDepth(11);
    this.tweens.add({
        targets: crtFlicker,
        alpha: 0.05,
        duration: 80,
        yoyo: true,
        repeat: -1
    });

    const linhasDoTerminal = [
      "HEATCORE FACILITY O.S. v7.2 - KERNEL INITIALIZATION",
      "Copyright (C) 2026-2042, Heatcore Industries.",
      "",
      "Checking core thermal limits.......... [NOMINAL]",
      "Booting SUB_LEVEL_02 local controls... [OK]",
      "",
      "Mounting operator firmware protocols...",
      " > SOLAR_UNIT_SYS   ... LOADED",
      " > FORNALHA_UNIT_SYS... LOADED",
      "",
      "Establishing Socket.IO uplink......... [CONNECTED]",
      "Synchronizing neural map matrices..... [OK]",
      "Calibrating physics engine modules.... [OK]",
      "",
      "Bypassing internal safety limits...... [OVERRIDE ACCEPTED]",
      "Checking hybrid controller mappings... [XINPUT/SNES DETECTED]",
      "All systems functional.",
      "",
      "BOOT SEQUENCE COMPLETE. ENTERING MAIN INTERFACE..."
    ];

    let consoleText = this.add.text(40, 40, "", {
      fontFamily: "'Courier New', Courier, monospace", 
      fontSize: 16,
      color: "#00f3ff", // Cor cyan moderna
      align: "left",
      shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 6, fill: true } 
    }).setDepth(15);

    // Efeito de "glitch" na posição X bem sutil
    this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
            if (Math.random() > 0.7 && !this.jaFoiProMenu) {
                consoleText.x = 42; 
                this.time.delayedCall(60, () => { consoleText.x = 40; }); 
            }
        }
    });

    let linhaAtual = 0;
    let textoAcumulado = "";

    this.time.addEvent({
      delay: 110, // Um pouco mais rápido para parecer um sistema moderno rodando logs velozes
      repeat: linhasDoTerminal.length - 1,
      callback: () => {
        if (this.jaFoiProMenu) return; 

        textoAcumulado += linhasDoTerminal[linhaAtual] + "\n";
        
        let textoFinal = textoAcumulado;
        consoleText.setText(textoFinal + "█");
        linhaAtual++;

        if (linhaAtual === linhasDoTerminal.length) {
          this.time.delayedCall(700, () => {
            this.irParaPreloader();
          });
        }
      }
    });

    // Permite pular o terminal com novo clique ou tecla do teclado
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

    // Transição moderna de apagão rápido
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop("Boot");
        this.scene.start("Preloader");
    });
  }
}
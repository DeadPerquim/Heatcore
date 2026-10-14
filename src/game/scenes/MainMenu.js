import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    // ==========================================
    // 1. FUNDO E TÍTULO TEMPORÁRIOS (Intactos para vocês mudarem depois)
    // ==========================================
    let bgGraphics = this.make.graphics({ add: false });
    bgGraphics.fillStyle(0x2a2a35, 1);
    bgGraphics.fillRect(0, 0, 800, 600); 
    bgGraphics.generateTexture('fundo_temporario', 800, 600);
    this.add.image(0, 0, 'fundo_temporario').setOrigin(0, 0);

    let titleGraphics = this.make.graphics({ add: false });
    titleGraphics.fillStyle(0xff5500, 1);
    titleGraphics.fillRect(0, 0, 350, 120);
    titleGraphics.generateTexture('titulo_temporario', 350, 120);
    
    this.add.image(40, 200, 'titulo_temporario').setOrigin(0, 0);
    
    // Adicionei uma sombra e borda ao título para ele se destacar
    this.add.text(215, 260, "HEATCORE", {
      fontSize: 54,
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 4,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
    }).setOrigin(0.5);

    // ==========================================
    // 2. MENU DIREITO POLIDO (Com Tweens e Sombras)
    // ==========================================
    let startY = 190; 
    let baseMenuX = 760; 
    
    const menuOptions = [
      { text: "Jogar", action: () => this.iniciarJogo() },
      { text: "Mapa Diário", action: () => this.irParaMapaDiario() }, // Atualizado!
      { text: "Opções", action: () => console.log("Em breve: Opções") },
      { text: "Créditos", action: () => console.log("Em breve: Créditos") }
    ];

    menuOptions.forEach((option, index) => {
      let btn = this.add.text(baseMenuX, startY + (index * 75), option.text, {
        fontSize: 34,
        color: "#dddddd",
        fontStyle: "bold",
        align: "right",
        stroke: "#000000",
        strokeThickness: 3, // Borda preta
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, fill: true }
      })
      .setOrigin(1, 0.5)
      // useHandCursor transforma o ponteiro numa mãozinha clicável
      .setInteractive({ useHandCursor: true }); 

      // === EFEITOS DE HOVER SUAVES (TWEENS) ===
      btn.on('pointerover', () => {
        btn.setColor('#ff9900'); // Laranja vibrante
        
        // Em vez de mudar na hora, cria uma animação fluida
        this.tweens.add({
          targets: btn,
          scaleX: 1.15,
          scaleY: 1.15,
          x: baseMenuX - 15, // Faz o texto deslizar um pouco para a esquerda
          duration: 150, // Duração de 150ms
          ease: 'Back.easeOut' // Efeito "elástico" no final
        });
      });

      btn.on('pointerout', () => {
        btn.setColor('#dddddd'); 
        
        // Anima a volta para o tamanho e posição originais
        this.tweens.add({
          targets: btn,
          scaleX: 1.0,
          scaleY: 1.0,
          x: baseMenuX,
          duration: 150,
          ease: 'Power2'
        });
      });

      // === EFEITO DE CLIQUE ===
      btn.on('pointerdown', () => {
        // Dá um pequeno sobressalto (encolhe e volta) ao clicar
        this.tweens.add({
            targets: btn,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 50,
            yoyo: true, // Faz a animação ir e voltar automaticamente
            onComplete: option.action // Só executa a ação quando o "click" terminar
        });
      });
    });

    this.jaIniciou = false;
  }

  update() {
    const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
    if (pad) {
        if (pad.A || (pad.buttons.length > 9 && pad.buttons[9].pressed)) {
            this.iniciarJogo();
        }
    }
  }

  iniciarJogo() {
    if (this.jaIniciou) return;
    this.jaIniciou = true;
    this.scene.stop();
    this.scene.start("Game"); 
  }

  irParaMapaDiario() {
    if (this.jaIniciou) return;
    this.jaIniciou = true;
    this.scene.stop();
    // Chama a futura cena. 
    // Lembre-se de adicioná-la no arquivo principal onde lista as cenas!
    this.scene.start("Diario"); 
  }
}
import { Scene } from "phaser";

export class PlacarTransicao extends Scene {
    constructor() {
        super('PlacarTransicao');
    }

    init(data) {
        // 🛡️ PRESERVA RESSALTADAMENTE A IDENTIDADE REAL DO JOGADOR LOCAL
        this.personagemInicial = this.game.meuPersonagem || (data && data.personagem) || 'solar';
        this.proximaCena = data ? (data.proximaCena || 'Mapa3') : 'Mapa3';
        this.pontosAntigosSolar = data ? (data.pontosSolar || 0) : 0;
        this.pontosAntigosFornalha = data ? (data.pontosFornalha || 0) : 0;
        this.quemMarcou = data ? (data.quemMarcou || 'solar') : 'solar';

        // Incrementa o ponto corretamente para quem marcou
        this.pontosNovosSolar = this.pontosAntigosSolar + (this.quemMarcou === 'solar' ? 1 : 0);
        this.pontosNovosFornalha = this.pontosAntigosFornalha + (this.quemMarcou === 'fornalha' ? 1 : 0);
    }

    create() {
        const { width, height } = this.scale;
        const cX = width / 2;
        const cY = height / 2;

        // ==========================================
        // 1. FUNDO DO LABORATÓRIO (Fallback caso não venha do Menu)
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
                bgCanvas.refresh();
            }
        }
        this.add.image(0, 0, 'fundo_lab_pro').setOrigin(0, 0).setDepth(0);

        // Efeito de Tela / Scanlines (CRT Grid)
        let scanlines = this.add.graphics();
        scanlines.fillStyle(0x000000, 0.15);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }
        scanlines.setDepth(5);

        // ==========================================
        // 2. HUD INDUSTRIAL
        // ==========================================
        this.add.text(30, 30, "SYS_STATUS // MATCH_RESULTS", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#00f3ff"
        }).setAlpha(0.6).setDepth(10);

        this.add.text(width - 30, height - 30, `TARGET: ${this.proximaCena.toUpperCase()}`, {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#8888aa"
        }).setOrigin(1, 1).setAlpha(0.5).setDepth(10);

        // ==========================================
        // 3. CARDS DE PERSONAGENS & DESTAQUE DE VITÓRIA
        // ==========================================
        const distCentro = 220;

        // Container Base (Molduras)
        const bgSolar = this.add.rectangle(cX - distCentro, cY + 10, 180, 220, 0x141622)
            .setStrokeStyle(2, this.quemMarcou === 'solar' ? 0x00ff66 : 0x333345)
            .setDepth(20);
        
        const bgFornalha = this.add.rectangle(cX + distCentro, cY + 10, 180, 220, 0x141622)
            .setStrokeStyle(2, this.quemMarcou === 'fornalha' ? 0x00ff66 : 0x333345)
            .setDepth(20);

        // Brilho na carta de quem fez o ponto
        if (this.quemMarcou === 'solar') {
            this.add.rectangle(cX - distCentro, cY + 10, 180, 220, 0x00ff66, 0.1).setDepth(21);
        } else if (this.quemMarcou === 'fornalha') {
            this.add.rectangle(cX + distCentro, cY + 10, 180, 220, 0x00ff66, 0.1).setDepth(21);
        }

        // ==========================================
        // 4. PREVIEWS DOS PERSONAGENS
        // ==========================================
        let spriteSolar, spriteFornalha;
        if (this.textures.exists('Personagens')) {
            const tex = this.textures.get('Personagens');
            const img = tex.getSourceImage();
            const halfW = Math.floor(img.width / 2);
            const h = img.height;

            const frameSolarKey = 'preview_solar_frame';
            const frameFornalhaKey = 'preview_fornalha_frame';

            if (!tex.has(frameSolarKey)) tex.add(frameSolarKey, 0, 0, 0, halfW, h);
            if (!tex.has(frameFornalhaKey)) tex.add(frameFornalhaKey, 0, halfW, 0, halfW, h);

            spriteSolar = this.add.image(cX - distCentro, cY - 15, 'Personagens', frameSolarKey)
                .setDisplaySize(110, 110).setDepth(30);

            spriteFornalha = this.add.image(cX + distCentro, cY - 15, 'Personagens', frameFornalhaKey)
                .setDisplaySize(110, 110).setDepth(30);
        } else {
            spriteSolar = this.add.sprite(cX - distCentro, cY - 15, 'solar_andando', 0)
                .setScale(2.5).setDepth(30);

            spriteFornalha = this.add.sprite(cX + distCentro, cY - 15, 'Fornalha')
                .setScale(2.5).setDepth(30);
        }

        // Nomes nos Cards
        this.add.text(cX - distCentro, cY + 80, "SOLAR", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 18, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(30);

        this.add.text(cX + distCentro, cY + 80, "FORNALHA", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 18, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(30);

        // ==========================================
        // 5. PLACAR PRINCIPAL
        // ==========================================
        const textoPlacar = this.add.text(cX, cY - 15, `${this.pontosAntigosSolar} x ${this.pontosAntigosFornalha}`, {
            fontFamily: "'Courier New', Courier, monospace", 
            fontSize: 56, 
            color: "#00f3ff", 
            fontStyle: "bold",
            stroke: "#000000", 
            strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 15, fill: true }
        }).setOrigin(0.5).setDepth(50);

        // ==========================================
        // 6. EFEITO DE TELA CRT LIGANDO/DESLIGANDO
        // ==========================================
        this.crtFundo = this.add.rectangle(cX, cY, width, height, 0x000000).setDepth(1000);
        this.crtLinha = this.add.rectangle(cX, cY, width, 4, 0xffffff).setDepth(1001).setScale(0, 1);

        // Animação Ligar Monitor
        this.tweens.add({
            targets: this.crtLinha,
            scaleX: 1,
            duration: 180,
            ease: 'Power2',
            onComplete: () => {
                // Expande a linha revelando o cenário
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
        // 7. ANIMAÇÃO DE +1 (FLUTUANDO)
        // ==========================================
        this.time.delayedCall(1200, () => {
            
            // 7.1 Posição em cima do personagem que marcou
            let alvoX = this.quemMarcou === 'solar' ? cX - distCentro : cX + distCentro;
            let startY = cY - 100;
            
            let floatText = this.add.text(alvoX, startY, "+1", {
                fontFamily: "'Courier New', Courier, monospace", 
                fontSize: 42, 
                color: "#00ff66", 
                fontStyle: "bold", 
                stroke: "#000000", 
                strokeThickness: 6,
                shadow: { offsetX: 0, offsetY: 0, color: '#00ff66', blur: 10, fill: true }
            }).setOrigin(0.5).setDepth(100).setAlpha(0);

            // Anima subindo e desaparecendo
            this.tweens.add({
                targets: floatText,
                y: startY - 60,
                alpha: 1,
                duration: 500,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.time.delayedCall(400, () => {
                        this.tweens.add({ targets: floatText, alpha: 0, y: startY - 90, duration: 400 });
                    });
                }
            });

            // 7.2 Atualiza e Pula o Placar Principal no meio da tela
            this.tweens.add({
                targets: textoPlacar,
                scale: { from: 1, to: 1.35 },
                duration: 250,
                yoyo: true,
                ease: 'Back.easeOut'
            });

            textoPlacar.setText(`${this.pontosNovosSolar} x ${this.pontosNovosFornalha}`);
            textoPlacar.setColor("#00ff66");
            textoPlacar.setShadow(0, 0, '#00ff66', 15, true);
        });

        // ==========================================
        // 8. ANIMAÇÃO DE DESLIGAR MONITOR E MUDAR FASE
        // ==========================================
        this.time.delayedCall(4200, () => {
            // Reseta a linha para fazer o reverso
            this.crtLinha.setScale(1, height / 2).setAlpha(0.8);
            
            // Fundo volta a ficar preto (espremendo a tela)
            this.tweens.add({
                targets: this.crtFundo,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });

            // Linha encolhe verticalmente...
            this.tweens.add({
                targets: this.crtLinha,
                scaleY: 1, // Volta a ter a altura real de 4 pixels
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    // E depois encolhe horizontalmente (estilo TV antiga desligando)
                    this.tweens.add({
                        targets: this.crtLinha,
                        scaleX: 0,
                        duration: 180,
                        ease: 'Power2',
                        onComplete: () => {
                            // Finalmente carrega a próxima fase
                            this.scene.start(this.proximaCena, {
                                personagem: this.game.meuPersonagem || this.personagemInicial,
                                pontosSolar: this.pontosNovosSolar,
                                pontosFornalha: this.pontosNovosFornalha
                            });
                        }
                    });
                }
            });
        });
    }
}
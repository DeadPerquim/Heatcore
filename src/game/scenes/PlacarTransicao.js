import { Scene } from "phaser";

export class PlacarTransicao extends Scene {
    constructor() {
        super('PlacarTransicao');
    }

    desbloquearAudio() {
        if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume().catch(() => {});
        }
    }

    init(data) {
        this.personagemInicial = this.game.meuPersonagem || (data && data.personagem) || 'solar';
        this.proximaCena = data ? (data.proximaCena || 'Mapa3') : 'Mapa3';
        this.pontosAntigosSolar = data ? (data.pontosSolar || 0) : 0;
        this.pontosAntigosFornalha = data ? (data.pontosFornalha || 0) : 0;
        this.quemMarcou = data ? (data.quemMarcou || 'solar') : 'solar';

        this.pontosNovosSolar = this.pontosAntigosSolar + (this.quemMarcou === 'solar' ? 1 : 0);
        this.pontosNovosFornalha = this.pontosAntigosFornalha + (this.quemMarcou === 'fornalha' ? 1 : 0);
        
        this.jaEstaSaindo = false;
    }

    create() {
        const { width, height } = this.scale;
        const cX = width / 2;
        const cY = height / 2;

        if (this.game.volumeSFX === undefined) this.game.volumeSFX = 0.7;

        let somAmbiente = this.sound.get('ambientacao');
        if (somAmbiente && somAmbiente.isPlaying) {
            somAmbiente.stop();
        }

        this.desbloquearAudio();

        // 1. FUNDO DO LABORATÓRIO
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

        let scanlines = this.add.graphics();
        scanlines.fillStyle(0x000000, 0.15);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }
        scanlines.setDepth(5);

        // 2. HUD INDUSTRIAL
        this.add.text(30, 30, "SYS_STATUS // RESULTADOS_CONCLUSÃO", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#00f3ff"
        }).setAlpha(0.6).setDepth(10);

        this.add.text(width - 30, height - 30, `PROXIMA FASE: ${this.proximaCena.toUpperCase()}`, {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#8888aa"
        }).setOrigin(1, 1).setAlpha(0.5).setDepth(10);

        // 3. CARDS E PERSONAGENS
        const distCentro = 220;

        this.bgSolar = this.add.rectangle(cX - distCentro, cY + 10, 180, 220, 0x141622)
            .setStrokeStyle(2, this.quemMarcou === 'solar' ? 0x00ff66 : 0x333345)
            .setDepth(20);
        
        this.bgFornalha = this.add.rectangle(cX + distCentro, cY + 10, 180, 220, 0x141622)
            .setStrokeStyle(2, this.quemMarcou === 'fornalha' ? 0x00ff66 : 0x333345)
            .setDepth(20);

        this.highlightSolar = null;
        this.highlightFornalha = null;

        if (this.quemMarcou === 'solar') {
            this.highlightSolar = this.add.rectangle(cX - distCentro, cY + 10, 180, 220, 0x00ff66, 0.1).setDepth(21);
        } else if (this.quemMarcou === 'fornalha') {
            this.highlightFornalha = this.add.rectangle(cX + distCentro, cY + 10, 180, 220, 0x00ff66, 0.1).setDepth(21);
        }

        // Previews dos Sprites
        if (this.textures.exists('Personagens')) {
            const tex = this.textures.get('Personagens');
            const img = tex.getSourceImage();
            const halfW = Math.floor(img.width / 2);
            const h = img.height;

            const frameSolarKey = 'preview_solar_frame';
            const frameFornalhaKey = 'preview_fornalha_frame';

            if (!tex.has(frameSolarKey)) tex.add(frameSolarKey, 0, 0, 0, halfW, h);
            if (!tex.has(frameFornalhaKey)) tex.add(frameFornalhaKey, 0, halfW, 0, halfW, h);

            this.spriteSolar = this.add.image(cX - distCentro, cY - 15, 'Personagens', frameSolarKey)
                .setDisplaySize(110, 110).setDepth(30);

            this.spriteFornalha = this.add.image(cX + distCentro, cY - 15, 'Personagens', frameFornalhaKey)
                .setDisplaySize(110, 110).setDepth(30);
        } else {
            this.spriteSolar = this.add.sprite(cX - distCentro, cY - 15, 'solar_andando', 0)
                .setScale(2.5).setDepth(30);

            this.spriteFornalha = this.add.sprite(cX + distCentro, cY - 15, 'fornalha_andando', 0)
                .setScale(2.5).setDepth(30);
        }

        this.txtSolar = this.add.text(cX - distCentro, cY + 80, "SOLAR", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 18, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(30);

        this.txtFornalha = this.add.text(cX + distCentro, cY + 80, "FORNALHA", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 18, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(30);

        // 4. PLACAR PRINCIPAL
        this.textoPlacar = this.add.text(cX, cY - 15, `${this.pontosAntigosSolar} x ${this.pontosAntigosFornalha}`, {
            fontFamily: "'Courier New', Courier, monospace", 
            fontSize: 56, 
            color: "#00f3ff", 
            fontStyle: "bold",
            stroke: "#000000", 
            strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 15, fill: true }
        }).setOrigin(0.5).setDepth(50);

        // 5. MÁSCARA CRT (Efeito CRT ligando)
        this.crtFundo = this.add.rectangle(cX, cY, width, height, 0x000000).setDepth(1000);
        this.crtLinha = this.add.rectangle(cX, cY, width, 4, 0xffffff).setDepth(1001).setScale(0, 1);

        if (this.cache.audio.exists('pc_ligando')) {
            this.sound.play('pc_ligando', { volume: this.game.volumeSFX });
        }

        this.tweens.add({
            targets: this.crtLinha,
            scaleX: 1,
            duration: 180,
            ease: 'Power2',
            onComplete: () => {
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

        // 6. ANIMAÇÃO DE +1 E ROTEAMENTO PARA CRÉDITOS OU PRÓXIMA FASE
        this.time.delayedCall(1200, () => {
            this.desbloquearAudio();

            const listaSonsPonto = ['sfx_ponto1', 'sfx_ponto2', 'sfx_ponto3'];
            const disponiveis = listaSonsPonto.filter(k => this.cache.audio.exists(k));

            if (disponiveis.length > 0) {
                const somSorteado = Phaser.Math.RND.pick(disponiveis);
                this.sound.play(somSorteado, { volume: this.game.volumeSFX });
            }

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

            this.tweens.add({
                targets: this.textoPlacar,
                scale: { from: 1, to: 1.35 },
                duration: 250,
                yoyo: true,
                ease: 'Back.easeOut'
            });

            this.textoPlacar.setText(`${this.pontosNovosSolar} x ${this.pontosNovosFornalha}`);
            this.textoPlacar.setColor("#00ff66");
            this.textoPlacar.setShadow(0, 0, '#00ff66', 15, true);

            // Se o próximo destino for os Créditos, inicia a celebração de vitória
            if (this.proximaCena === 'Creditos') {
                this.time.delayedCall(1200, () => {
                    this.executarAnimacaoVitoriaGeral(width, height, cX, cY);
                });
            } else {
                // Para mapas intermediários, faz a transição normal após guardar os pontos
                this.time.delayedCall(2200, () => {
                    this.executarTransicaoSaida();
                });
            }
        });
    }

    executarAnimacaoVitoriaGeral(width, height, cX, cY) {
        let vencedor = null;
        if (this.pontosNovosSolar > this.pontosNovosFornalha) vencedor = 'solar';
        else if (this.pontosNovosFornalha > this.pontosNovosSolar) vencedor = 'fornalha';
        else vencedor = 'empate';

        // Esconde o placar do centro
        this.tweens.add({ targets: this.textoPlacar, alpha: 0, duration: 400 });

        let elementosVencedor = [];
        let elementosPerdedor = [];

        if (vencedor === 'solar') {
            this.bgSolar.setStrokeStyle(2, 0x00ff66);
            if (!this.highlightSolar) {
                this.highlightSolar = this.add.rectangle(this.bgSolar.x, this.bgSolar.y, 180, 220, 0x00ff66, 0.1).setDepth(21);
            }
            elementosVencedor = [this.bgSolar, this.spriteSolar, this.txtSolar, this.highlightSolar];
            
            elementosPerdedor = [this.bgFornalha, this.spriteFornalha, this.txtFornalha];
            if (this.highlightFornalha) elementosPerdedor.push(this.highlightFornalha);

        } else if (vencedor === 'fornalha') {
            this.bgFornalha.setStrokeStyle(2, 0x00ff66);
            if (!this.highlightFornalha) {
                this.highlightFornalha = this.add.rectangle(this.bgFornalha.x, this.bgFornalha.y, 180, 220, 0x00ff66, 0.1).setDepth(21);
            }
            elementosVencedor = [this.bgFornalha, this.spriteFornalha, this.txtFornalha, this.highlightFornalha];
            
            elementosPerdedor = [this.bgSolar, this.spriteSolar, this.txtSolar];
            if (this.highlightSolar) elementosPerdedor.push(this.highlightSolar);

        } else {
            elementosVencedor = [this.bgSolar, this.spriteSolar, this.txtSolar, this.bgFornalha, this.spriteFornalha, this.txtFornalha];
            if (this.highlightSolar) elementosVencedor.push(this.highlightSolar);
            if (this.highlightFornalha) elementosPerdedor.push(this.highlightFornalha);
        }

        // Esconde o perdedor
        if (elementosPerdedor.length > 0) {
            this.tweens.add({
                targets: elementosPerdedor,
                alpha: 0,
                duration: 500
            });
        }

        // Move o vencedor para o centro da tela
        if (vencedor !== 'empate') {
            this.tweens.add({
                targets: elementosVencedor,
                x: cX,
                duration: 800,
                ease: 'Cubic.easeOut'
            });
        }

        // Exibe texto de vitória e solta confetes
        this.time.delayedCall(600, () => {
            const nomeStr = vencedor === 'empate' ? "EMPATE!" : (vencedor === 'solar' ? "SOLAR VENCEU!" : "FORNALHA VENCEU!");
            const corTexto = vencedor === 'solar' ? '#00f3ff' : (vencedor === 'fornalha' ? '#ff9900' : '#ffffff');

            this.sound.play('sfx_vitoria', { volume: this.game.volumeSFX });
            this.sound.play('sfx_aplausos', { volume: this.game.volumeSFX });

            const txtVitoria = this.add.text(cX, cY + 160, nomeStr, {
                fontFamily: "'Courier New', Courier, monospace", 
                fontSize: 40, 
                color: corTexto, 
                fontStyle: "bold",
                stroke: "#000000", 
                strokeThickness: 6,
                shadow: { offsetX: 0, offsetY: 0, color: corTexto, blur: 15, fill: true }
            }).setOrigin(0.5).setDepth(150).setAlpha(0).setScale(0.5);

            this.tweens.add({
                targets: txtVitoria,
                alpha: 1,
                scale: 1,
                duration: 500,
                ease: 'Back.easeOut'
            });

            this.soltarConfetes(width, height);
            
            // Aguarda a celebração e desliga o monitor para abrir os Créditos
            this.time.delayedCall(3500, () => {
                this.executarTransicaoSaida();
            });
        });
    }

    soltarConfetes(width, height) {
        if (!this.textures.exists('confete_tile')) {
            let confCanvas = this.textures.createCanvas('confete_tile', 8, 8);
            confCanvas.context.fillStyle = '#ffffff';
            confCanvas.context.fillRect(0, 0, 8, 8);
            confCanvas.refresh();
        }

        const cores = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff9900];
        
        try {
            this.add.particles(0, -10, 'confete_tile', {
                x: { min: 0, max: width },
                y: -10,
                tint: cores,
                speedY: { min: 120, max: 350 },
                speedX: { min: -80, max: 80 },
                scale: { min: 0.6, max: 1.3 },
                rotate: { start: 0, end: 360 },
                gravityY: 180,
                lifespan: 4500,
                quantity: 3,
                frequency: 60,
                depth: 140
            });
        } catch (e) {
            const particles = this.add.particles('confete_tile');
            particles.setDepth(140);
            particles.createEmitter({
                x: { min: 0, max: width },
                y: -10,
                tint: cores,
                speedY: { min: 120, max: 350 },
                speedX: { min: -80, max: 80 },
                scale: { min: 0.6, max: 1.3 },
                rotate: { start: 0, end: 360 },
                gravityY: 180,
                lifespan: 4500,
                quantity: 3,
                frequency: 60
            });
        }
    }

    executarTransicaoSaida() {
        if (this.jaEstaSaindo) return;
        this.jaEstaSaindo = true;

        const { height } = this.scale;

        this.crtLinha.setVisible(true).setAlpha(1).setScale(1, height / 2);
        this.crtFundo.setVisible(true).setAlpha(1);

        this.tweens.add({
            targets: this.crtLinha,
            scaleY: 0.01,
            duration: 220,
            ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: this.crtLinha,
                    scaleX: 0,
                    duration: 180,
                    ease: 'Power2',
                    onComplete: () => {
                        this.scene.start(this.proximaCena, {
                            personagem: this.game.meuPersonagem || this.personagemInicial,
                            pontosSolar: this.pontosNovosSolar,
                            pontosFornalha: this.pontosNovosFornalha
                        });
                    }
                });
            }
        });
    }
}
import { Scene } from "phaser";

export class Avaliar extends Scene {
    constructor() {
        super('Avaliar');
    }

    init(data) {
        this.dadosRecebidos = data || {};
        this.personagemInicial = (data && data.personagem) ? data.personagem : (this.game.meuPersonagem || 'solar');
    }

    preload() {
        const urlFormulario = "https://docs.google.com/forms/d/e/1FAIpQLSeeleFRJ3PbTeX9nmxFtfqF_3VMD6bBGixNGFODEtqjbHGK9A/viewform?entry.52413313=Heatcore";
        const urlQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(urlFormulario)}`;

        if (!this.textures.exists('qrcode_heatcore')) {
            this.load.setCORS('anonymous');
            this.load.image('qrcode_heatcore', urlQrApi);
        }
    }

    create() {
        const sw = this.scale.width;
        const sh = this.scale.height;

        // Travas de segurança para impedir qualquer skip antes dos 10 segundos
        this.podeProsseguir = false;
        this.jaEstaSaindo = false;
        this.tempoRestante = 10;
        this.botoesGamepadAnteriores = new Set();

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // ==============================================================
        // FUNDO E MOLDURA ESTILO TERMINAL / MENU DO HEATCORE
        // ==============================================================
        this.add.rectangle(0, 0, sw, sh, 0x06070b, 1).setOrigin(0);

        const bgGraphics = this.add.graphics();

        // Grid sutil de fundo
        bgGraphics.lineStyle(1, 0x00f3ff, 0.04);
        for (let x = 0; x < sw; x += 32) {
            bgGraphics.moveTo(x, 0);
            bgGraphics.lineTo(x, sh);
        }
        for (let y = 0; y < sh; y += 32) {
            bgGraphics.moveTo(0, y);
            bgGraphics.lineTo(sw, y);
        }
        bgGraphics.strokePath();

        // Borda externa ciano
        bgGraphics.lineStyle(2, 0x00f3ff, 0.25);
        bgGraphics.strokeRect(20, 20, sw - 40, sh - 40);

        // Cantoneiras laranja
        bgGraphics.lineStyle(3, 0xff9900, 0.9);
        const l = 24;
        bgGraphics.beginPath();
        // Superior esquerdo
        bgGraphics.moveTo(20, 20 + l); bgGraphics.lineTo(20, 20); bgGraphics.lineTo(20 + l, 20);
        // Superior direito
        bgGraphics.moveTo(sw - 20 - l, 20); bgGraphics.lineTo(sw - 20, 20); bgGraphics.lineTo(sw - 20, 20 + l);
        // Inferior esquerdo
        bgGraphics.moveTo(20, sh - 20 - l); bgGraphics.lineTo(20, sh - 20); bgGraphics.lineTo(20 + l, sh - 20);
        // Inferior direito
        bgGraphics.moveTo(sw - 20 - l, sh - 20); bgGraphics.lineTo(sw - 20, sh - 20); bgGraphics.lineTo(sw - 20, sh - 20 - l);
        bgGraphics.strokePath();

        // Scanlines sutis
        const scanGraphics = this.add.graphics();
        scanGraphics.fillStyle(0x000000, 0.18);
        for (let y = 0; y < sh; y += 6) {
            scanGraphics.fillRect(0, y, sw, 2);
        }

        // ==============================================================
        // TEXTOS DE CABEÇALHO
        // ==============================================================
        this.add.text(40, 36, "SYS_FEEDBACK // PESQUISA DE EXPERIÊNCIA", {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 12,
            color: "#00f3ff"
        }).setAlpha(0.7);

        const txtTitulo = this.add.text(sw / 2, sh * 0.13, ">> AVALIE O HEATCORE <<", {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 28,
            color: "#ff9900",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#ff9900', blur: 10, fill: true }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txtTitulo,
            alpha: { from: 0.75, to: 1 },
            duration: 900,
            yoyo: true,
            repeat: -1
        });

        this.add.text(sw / 2, sh * 0.21, "Aponte a câmera do seu celular para o QR Code abaixo\ne ajude a melhorar o projeto com a sua avaliação!", {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 15,
            color: "#dddddd",
            align: "center",
            lineSpacing: 6
        }).setOrigin(0.5);

        // ==============================================================
        // QR CODE NO CENTRO DA TELA (Tamanho ajustado para não cobrir textos)
        // ==============================================================
        const qrCenterX = sw / 2;
        const qrCenterY = sh * 0.53;
        const boxSize = Math.min(196, Math.floor(sh * 0.39));
        const qrSize = boxSize - 16;
        const framePadding = 10;

        // Moldura externa luminosa do QR Code
        const qrFrame = this.add.graphics();
        qrFrame.fillStyle(0x001a33, 0.75);
        qrFrame.fillRoundedRect(
            qrCenterX - (boxSize / 2) - framePadding,
            qrCenterY - (boxSize / 2) - framePadding,
            boxSize + (framePadding * 2),
            boxSize + (framePadding * 2),
            12
        );
        qrFrame.lineStyle(2, 0x00f3ff, 0.85);
        qrFrame.strokeRoundedRect(
            qrCenterX - (boxSize / 2) - framePadding,
            qrCenterY - (boxSize / 2) - framePadding,
            boxSize + (framePadding * 2),
            boxSize + (framePadding * 2),
            12
        );

        // Fundo branco sólido para leitura perfeita do QR Code por qualquer câmera
        this.add.rectangle(qrCenterX, qrCenterY, boxSize, boxSize, 0xffffff, 1).setOrigin(0.5);

        if (this.textures.exists('qrcode_heatcore') && this.textures.get('qrcode_heatcore').key !== '__MISSING') {
            const qrImage = this.add.image(qrCenterX, qrCenterY, 'qrcode_heatcore');
            qrImage.setDisplaySize(qrSize, qrSize);
        } else {
            // Fallback caso o PC esteja totalmente sem internet ao carregar a textura
            this.add.text(qrCenterX, qrCenterY, "FORMULÁRIO DE AVALIAÇÃO\n\nProjeto: Heatcore\n(Verifique a conexão\npara exibir o QR Code)", {
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                color: "#06070b",
                fontStyle: "bold",
                align: "center"
            }).setOrigin(0.5);
        }

        // Linha de scanner decorativa passando pelo QR Code
        const scanOffset = (boxSize / 2) - 6;
        const scannerLine = this.add.rectangle(qrCenterX, qrCenterY - scanOffset, boxSize - 8, 2, 0xff9900, 0.65);
        this.tweens.add({
            targets: scannerLine,
            y: qrCenterY + scanOffset,
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ==============================================================
        // CONTADOR DE 10 SEGUNDOS E BARRA DE PROGRESSO
        // ==============================================================
        const barWidth = 340;
        const barHeight = 8;
        const barY = sh - 85;

        const barBg = this.add.graphics();
        barBg.fillStyle(0x001a33, 0.9);
        barBg.fillRect(sw / 2 - barWidth / 2, barY, barWidth, barHeight);
        barBg.lineStyle(1, 0x00f3ff, 0.5);
        barBg.strokeRect(sw / 2 - barWidth / 2, barY, barWidth, barHeight);

        const barFill = this.add.rectangle(sw / 2 - barWidth / 2, barY + barHeight / 2, 0, barHeight - 2, 0xff9900, 1).setOrigin(0, 0.5);

        this.tweens.add({
            targets: barFill,
            width: barWidth,
            duration: 10000,
            ease: 'Linear'
        });

        this.txtStatusInferior = this.add.text(sw / 2, sh - 52, `[ AGUARDE ${this.tempoRestante}s PARA CONTINUAR... ]`, {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 15,
            color: "#ff9900",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // Atualiza o texto da contagem regressiva a cada 1 segundo
        this.timerContagem = this.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
                this.tempoRestante--;
                if (this.tempoRestante > 0 && !this.podeProsseguir) {
                    this.txtStatusInferior.setText(`[ AGUARDE ${this.tempoRestante}s PARA CONTINUAR... ]`);
                }
            }
        });

        // Libera o avanço SOMENTE após 10 segundos exatos
        this.time.delayedCall(10000, () => {
            this.liberarAvanco();
        });
    }

    liberarAvanco() {
        if (this.podeProsseguir || this.jaEstaSaindo) return;

        // Salva botões do controle que já estavam segurados antes dos 10s para evitar skip acidental
        this.registrarBotoesGamepadAtuais();

        this.podeProsseguir = true;
        this.txtStatusInferior.setColor("#00ff66");
        this.txtStatusInferior.setText("[ PRESSIONE QUALQUER BOTÃO PARA IR AOS CRÉDITOS ]");

        this.tweens.add({
            targets: this.txtStatusInferior,
            alpha: { from: 0.3, to: 1 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        // Listeners ativados exclusivamente após os 10 segundos
        this._onKeyDown = () => this.irParaCreditos();
        this._onPointerDown = () => this.irParaCreditos();

        this.input.keyboard.once('keydown', this._onKeyDown);
        this.input.once('pointerdown', this._onPointerDown);
    }

    registrarBotoesGamepadAtuais() {
        this.botoesGamepadAnteriores.clear();
        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        if (pad && pad.buttons) {
            pad.buttons.forEach((btn, idx) => {
                if (btn.pressed || btn.value > 0.5) this.botoesGamepadAnteriores.add(`p_${idx}`);
            });
        }
        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
            const rawPads = navigator.getGamepads();
            for (let p = 0; p < rawPads.length; p++) {
                if (rawPads[p] && rawPads[p].buttons) {
                    for (let b = 0; b < rawPads[p].buttons.length; b++) {
                        if (rawPads[p].buttons[b].pressed || rawPads[p].buttons[b].value > 0.5) {
                            this.botoesGamepadAnteriores.add(`r_${p}_${b}`);
                        }
                    }
                }
            }
        }
    }

    update() {
        // Bloqueio absoluto antes dos 10 segundos
        if (!this.podeProsseguir || this.jaEstaSaindo) return;

        // Verifica se algum botão novo do controle/gamepad foi pressionado após os 10s
        let apertouNovoBotaoGamepad = false;

        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        if (pad && pad.buttons) {
            for (let i = 0; i < pad.buttons.length; i++) {
                const chave = `p_${i}`;
                const pressionado = pad.buttons[i].pressed || pad.buttons[i].value > 0.5;
                if (pressionado && !this.botoesGamepadAnteriores.has(chave)) {
                    apertouNovoBotaoGamepad = true;
                } else if (!pressionado) {
                    this.botoesGamepadAnteriores.delete(chave);
                }
            }
        }

        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
            const rawPads = navigator.getGamepads();
            for (let p = 0; p < rawPads.length; p++) {
                if (rawPads[p] && rawPads[p].buttons) {
                    for (let b = 0; b < rawPads[p].buttons.length; b++) {
                        const chave = `r_${p}_${b}`;
                        const pressionado = rawPads[p].buttons[b].pressed || rawPads[p].buttons[b].value > 0.5;
                        if (pressionado && !this.botoesGamepadAnteriores.has(chave)) {
                            apertouNovoBotaoGamepad = true;
                        } else if (!pressionado) {
                            this.botoesGamepadAnteriores.delete(chave);
                        }
                    }
                }
            }
        }

        if (apertouNovoBotaoGamepad) {
            this.irParaCreditos();
        }
    }

    irParaCreditos() {
        if (!this.podeProsseguir || this.jaEstaSaindo) return;
        this.jaEstaSaindo = true;

        if (this._onKeyDown) this.input.keyboard.off('keydown', this._onKeyDown);
        if (this._onPointerDown) this.input.off('pointerdown', this._onPointerDown);

        const vol = this.game.volumeSFX !== undefined ? this.game.volumeSFX * 0.5 : 0.3;
        if (this.cache.audio.exists('sfx_clicar_botao')) {
            this.sound.play('sfx_clicar_botao', { volume: vol });
        } else if (this.cache.audio.exists('click')) {
            this.sound.play('click', { volume: vol });
        }

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.stop();
            this.scene.start('Creditos', this.dadosRecebidos);
        });
    }
}
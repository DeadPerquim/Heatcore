import { Scene } from "phaser";

export class Salas extends Scene {
    constructor() {
        super("Salas");
    }

    init(data) {
        this.estadoCena = data.modoInicial || "CREATE_ROOM"; 
        this.socket = this.game.socket;
        
        this.configSala = {
            isSingleplayer: this.estadoCena === "SINGLEPLAYER",
            isPrivate: false,
            modo: 'HISTORIA', // HISTORIA, ESPECIFICO, HORARIO
            mapaId: 1,
            horarioTipo: 'PLATAFORMAS', // PLATAFORMAS, LABIRINTO
            hostNick: "Player1",
            hostPersonagem: "solar"
        };

        this.campoEditando = null; 
        this.codigoDigitado = "";
        this.piscaCursor = true;
    }

    create() {
        const { width, height } = this.scale;
        
        // Timer para o cursor piscante
        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                this.piscaCursor = !this.piscaCursor;
                if (this.campoEditando && !this.mapOverlayContainer) {
                    this.atualizarInterfaceAtual();
                }
            }
        });

        // ==========================================
        // 1. FUNDO DE LABORATÓRIO E BRILHO
        // ==========================================
        if (this.textures.exists('fundo_lab_pro')) {
            this.add.image(0, 0, 'fundo_lab_pro').setOrigin(0, 0).setDepth(0);
        } else {
            this.add.rectangle(0, 0, width, height, 0x0a0c14).setOrigin(0, 0).setDepth(0);
            this.add.grid(0, 0, width, height, 35, 35, 0x0a0c14, 1, 0x111122, 0.4).setOrigin(0, 0).setDepth(0);
        }

        this.glowAmber = this.add.circle(width * 0.2, height * 0.4, 260, 0xff5500, 0.12).setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
        this.glowCyan = this.add.circle(width * 0.8, height * 0.7, 220, 0x00f3ff, 0.06).setBlendMode(Phaser.BlendModes.ADD).setDepth(1);

        this.tweens.add({ targets: this.glowAmber, alpha: { from: 0.10, to: 0.20 }, scale: { from: 0.95, to: 1.1 }, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.glowCyan, alpha: { from: 0.04, to: 0.10 }, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        if (!this.textures.exists('particula_brasa')) {
            let pGraphics = this.make.graphics({ add: false });
            pGraphics.fillStyle(0xffffff, 1); pGraphics.fillCircle(4, 4, 4); pGraphics.generateTexture('particula_brasa', 8, 8);
        }
        this.add.particles(0, 0, 'particula_brasa', {
            x: { min: 0, max: width }, y: { min: height + 10, max: height + 30 },
            lifespan: { min: 4000, max: 7000 }, speedY: { min: -20, max: -50 }, speedX: { min: -15, max: 15 },
            scale: { start: 0.6, end: 0 }, alpha: { start: 0.5, end: 0 },
            tint: [0xffaa00, 0xff4400, 0x00f3ff], quantity: 1, frequency: 250, blendMode: 'ADD'
        }).setDepth(2);

        // ==========================================
        // 2. HUD INDUSTRIAL SUPERIOR
        // ==========================================
        this.add.text(40, 25, "SYS_STATUS // CONFIG_MODE", { fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#00f3ff" }).setAlpha(0.6).setDepth(20);
        this.tituloTexto = this.add.text(40, 40, "// GERENCIADOR DE SESSÕES", { fontFamily: "'Courier New', Courier, monospace", fontSize: 24, color: "#00f3ff", fontStyle: "bold" }).setDepth(20);

        let linhaHud = this.add.graphics().setDepth(20);
        linhaHud.lineStyle(2, 0x00f3ff, 0.5);
        linhaHud.lineBetween(40, 70, 320, 70);

        this.painelContainer = this.add.container(0, 0).setDepth(10);

        this.input.keyboard.on('keydown', (event) => {
            if (!this.campoEditando || this.mapOverlayContainer) return;

            let alvo = this.campoEditando === 'nick' ? this.configSala.hostNick : this.codigoDigitado;

            if (event.keyCode === 8) { 
                if (alvo.length > 0) alvo = alvo.slice(0, -1);
                this.tocarSomCurto();
            } else if (event.keyCode === 13 || event.keyCode === 27) { 
                this.campoEditando = null;
                this.tocarSomCurto();
            } else if (event.key.length === 1) {
                if (this.campoEditando === 'nick' && alvo.length < 10 && event.key.match(/[a-zA-Z0-9_ ]/)) {
                    alvo += event.key; this.tocarSomCurto();
                } else if (this.campoEditando === 'codigo' && alvo.length < 4 && event.key.match(/[a-zA-Z0-9]/)) {
                    alvo += event.key.toUpperCase(); this.tocarSomCurto();
                }
            }

            if (this.campoEditando === 'nick') this.configSala.hostNick = alvo;
            if (this.campoEditando === 'codigo') this.codigoDigitado = alvo;
            
            this.atualizarInterfaceAtual();
        });

        this.input.on('pointerdown', (pointer, targets) => {
            if (targets.length === 0 && this.campoEditando && !this.mapOverlayContainer) {
                this.campoEditando = null;
                this.atualizarInterfaceAtual();
            }
        });

        this.atualizarInterfaceAtual();

        // ------------------------------------------
        // EVENTOS DE REDE
        // ------------------------------------------

        // Alertas de erro do servidor
        this.socket.off('erroLobby');
        this.socket.on('erroLobby', (msg) => { alert("ALERTA DO SISTEMA:\n" + msg); });

        // Quando o HOST cria a sala com sucesso
        this.socket.off('salaCriada');
        this.socket.on('salaCriada', (salaInfo) => { 
            this.estadoCena = "LOBBY"; 
            this.salaAtual = salaInfo; 
            this.atualizarInterfaceAtual(); 
        });

        // Quando ocorrem atualizações na sala (ex: GUEST conectou)
        this.socket.off('atualizacaoLobby');
        this.socket.on('atualizacaoLobby', (salaInfo) => { 
            this.salaAtual = salaInfo; 
            
            if (this.estadoCena !== "LOBBY") {
                this.estadoCena = "LOBBY";
            }
            
            this.atualizarInterfaceAtual(); 
        });

        this.socket.off('partidaIniciada');
        this.socket.on('partidaIniciada', (salaInfo) => {
            let musicaMenu = this.sound.get('menu');
            if (musicaMenu && musicaMenu.isPlaying) musicaMenu.stop();

            const meuPersonagem = salaInfo.jogadores[this.socket.id].personagem;
            this.game.meuPersonagem = meuPersonagem;
            this.game.salaId = salaInfo.id;
            
            let cenaDestino = "Mapa1";
            if (salaInfo.modo === 'ESPECIFICO') cenaDestino = `Mapa${salaInfo.mapaId}`;
            if (salaInfo.modo === 'HORARIO') cenaDestino = "Diario";

            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(cenaDestino, { 
                    personagem: meuPersonagem, 
                    modoDiario: salaInfo.horarioTipo, 
                    pontosSolar: 0, 
                    pontosFornalha: 0,
                    mostrarTutorial: true
                });
            });
        });
    }

    tocarSomCurto() {
        let vol = this.game.volumeSFX !== undefined ? this.game.volumeSFX * 0.5 : 0.3;
        if (this.cache.audio.exists('sfx_clicar_botao')) {
            this.sound.play('sfx_clicar_botao', {volume: vol});
        } else if (this.cache.audio.exists('click')) {
            this.sound.play('click', {volume: vol});
        }
    }

    atualizarInterfaceAtual() {
        if (this.mapOverlayContainer) return; 
        
        this.painelContainer.removeAll(true);

        if (this.estadoCena === "CREATE_ROOM" || this.estadoCena === "SINGLEPLAYER") this.construirInterfaceCriacao();
        else if (this.estadoCena === "BROWSER") this.construirInterfaceBrowser();
        else if (this.estadoCena === "JOIN_CODE") this.construirInterfaceCodigo();
        else if (this.estadoCena === "LOBBY") this.construirInterfaceLobby();
    }

    criarBotaoEstilizado(x, y, w, h, texto, callback, bgCor = 0x141624, bordaCor = 0x00f3ff, textoCor = "#ffffff") {
        let btnBg = this.add.rectangle(x, y, w, h, bgCor).setOrigin(0, 0.5).setStrokeStyle(1.5, bordaCor);
        let btnTxt = this.add.text(x + w/2, y, texto, { fontSize: 15, color: textoCor, fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0.5);
        
        btnBg.setInteractive({ useHandCursor: true });
        
        btnBg.on('pointerover', () => { btnBg.setFillStyle(bordaCor, 0.2); btnBg.setScale(1.02); btnTxt.setScale(1.02); });
        btnBg.on('pointerout', () => { btnBg.setFillStyle(bgCor, 1); btnBg.setScale(1); btnTxt.setScale(1); });
        btnBg.on('pointerdown', (p, lx, ly, ev) => {
            ev.stopPropagation(); this.campoEditando = null; callback();
        });

        this.painelContainer.add([btnBg, btnTxt]);
        return btnBg;
    }

    criarCampoTexto(x, y, w, h, label, valor, campoId) {
        let isAtivo = this.campoEditando === campoId;
        
        let lbl = this.add.text(x, y - 22, label, { fontSize: 13, color: "#8888aa", fontFamily: "Courier" });
        
        let bg = this.add.rectangle(x, y, w, h, isAtivo ? 0x1f2233 : 0x0a0c14).setOrigin(0, 0.5)
            .setStrokeStyle(1.5, isAtivo ? 0xff9900 : 0x444455).setInteractive({ useHandCursor: true });
        
        let displayValor = valor + (isAtivo ? (this.piscaCursor ? "|" : " ") : "");
        let txt = this.add.text(x + 15, y, displayValor, { fontSize: 16, color: isAtivo ? "#ff9900" : "#ffffff", fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0, 0.5);

        bg.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); this.campoEditando = campoId; this.atualizarInterfaceAtual(); });
        
        this.painelContainer.add([lbl, bg, txt]);
    }

    // ==========================================
    // OVERLAY DE SELEÇÃO DE MAPAS (COM SCROLL E ANTIDUPLO CLIQUE)
    // ==========================================
    abrirOverlayMapas() {
        if (this.mapOverlayContainer) return;
        this.tocarSomCurto();
        this.campoEditando = null; 

        const sw = this.scale.width;
        const sh = this.scale.height;
        this.mapOverlayContainer = this.add.container(0, 0).setDepth(2000);

        // Trava temporária contra clique duplo (ignora pointerup por 250ms)
        let bloquearCliques = true;
        this.time.delayedCall(250, () => { bloquearCliques = false; });

        // Fundo principal transparente
        let bg = this.add.rectangle(0, 0, sw, sh, 0x000000, 0.90).setOrigin(0).setInteractive();
        this.mapOverlayContainer.add(bg);

        // Novo Container Interno exclusivo para deslizar (scroll)
        this.mapGridContainer = this.add.container(0, 0);
        this.mapOverlayContainer.add(this.mapGridContainer);

        const mapasAtivos = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
        ];

        let gridX = sw/2 - 255; 
        let gridY = 140; 
        let col = 0;

        let totalRows = Math.ceil(mapasAtivos.length / 4);
        let contentHeight = 140 + (totalRows * 130);
        let minScrollY = Math.min(0, sh - contentHeight - 110); 

        let isDragging = false;
        let startY = 0;
        let startGridY = 0;
        let moved = false;

        const iniciarDrag = (pointer) => {
            isDragging = true;
            startY = pointer.y;
            startGridY = this.mapGridContainer.y;
            moved = false;
        };

        bg.on('pointerdown', iniciarDrag);

        this._moveListener = (pointer) => {
            if (isDragging && this.mapGridContainer) {
                let delta = pointer.y - startY;
                if (Math.abs(delta) > 5) moved = true;
                this.mapGridContainer.y = Phaser.Math.Clamp(startGridY + delta, minScrollY, 0);
            }
        };
        this.input.on('pointermove', this._moveListener);

        this._upListener = () => { isDragging = false; };
        this.input.on('pointerup', this._upListener);

        this._wheelListener = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (this.mapGridContainer) {
                this.mapGridContainer.y -= deltaY * 0.8;
                this.mapGridContainer.y = Phaser.Math.Clamp(this.mapGridContainer.y, minScrollY, 0);
            }
        };
        this.input.on('wheel', this._wheelListener);

        mapasAtivos.forEach(i => {
            let imgKey = 'preview_mapa' + i;
            let mapExists = this.textures.exists(imgKey);
            
            let px = gridX + (col * 170);
            let py = gridY;
            
            let box = this.add.rectangle(px, py, 150, 110, 0x111118).setOrigin(0.5).setStrokeStyle(2, 0x444455).setInteractive({useHandCursor: true});
            this.mapGridContainer.add(box);
            
            if (mapExists) {
                let imgMap = this.add.image(px, py - 12, imgKey).setOrigin(0.5);
                let scale = Math.min(140 / imgMap.width, 75 / imgMap.height);
                imgMap.setScale(scale);
                this.mapGridContainer.add(imgMap);
            } else {
                let noSignal = this.add.text(px, py - 12, "SEM SINAL", {fontSize: 12, color: "#ff4444", fontFamily: "Courier"}).setOrigin(0.5);
                this.mapGridContainer.add(noSignal);
            }

            let txtName = this.add.text(px, py + 40, "MAPA " + i, { fontSize: 15, color: "#ffffff", fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0.5);
            this.mapGridContainer.add(txtName);

            box.on('pointerover', () => { if(!isDragging) box.setStrokeStyle(2, 0xff9900); });
            box.on('pointerout', () => { box.setStrokeStyle(2, 0x444455); });
            
            box.on('pointerdown', iniciarDrag); 
            
            box.on('pointerup', () => {
                if (!bloquearCliques && !moved) {
                    this.tocarSomCurto();
                    this.configSala.mapaId = i;
                    this.fecharOverlayMapas();
                }
            });

            col++;
            if (col >= 4) { col = 0; gridY += 130; }
        });

        // UI Fixa Topo e Rodapé
        let bgTop = this.add.rectangle(0, 0, sw, 100, 0x000000, 0.95).setOrigin(0);
        let title = this.add.text(sw/2, 50, "// SELECIONE O SETOR OPERACIONAL", { fontSize: 24, color: "#ff9900", fontFamily: "Courier", fontStyle: "bold", shadow: {blur: 5, color: '#ff9900', fill: true} }).setOrigin(0.5);
        let txtScroll = this.add.text(sw/2, 80, "(Use o Scroll do mouse ou arraste para subir/descer)", { fontSize: 12, color: "#8888aa", fontFamily: "Courier" }).setOrigin(0.5);
        this.mapOverlayContainer.add([bgTop, title, txtScroll]);

        let bgBot = this.add.rectangle(0, sh - 80, sw, 80, 0x000000, 0.95).setOrigin(0);
        let btnFechar = this.add.rectangle(sw/2, sh - 40, 200, 45, 0x330000).setOrigin(0.5).setStrokeStyle(2, 0xff4444).setInteractive({useHandCursor: true});
        let txtFechar = this.add.text(sw/2, sh - 40, "[ CANCELAR ]", { fontSize: 16, color: "#ff4444", fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0.5);
        
        btnFechar.on('pointerdown', () => { this.tocarSomCurto(); this.fecharOverlayMapas(); });
        this.mapOverlayContainer.add([bgBot, btnFechar, txtFechar]);
    }

    fecharOverlayMapas() {
        if (this.mapOverlayContainer) {
            if (this._moveListener) this.input.off('pointermove', this._moveListener);
            if (this._upListener) this.input.off('pointerup', this._upListener);
            if (this._wheelListener) this.input.off('wheel', this._wheelListener);

            this.mapOverlayContainer.destroy();
            this.mapOverlayContainer = null;
            this.atualizarInterfaceAtual();
        }
    }

    // ==========================================
    // 1. INTERFACE DE CRIAÇÃO
    // ==========================================
    construirInterfaceCriacao() {
        this.tituloTexto.setText(this.configSala.isSingleplayer ? "// SETUP: SINGLEPLAYER" : "// SETUP: CRIAR SESSÃO MULTIPLAYER");

        const xEsq = 50;
        const xDir = 380; 
        let yEsq = 125; 
        const gapY = 75; 

        // ---- COLUNA ESQUERDA ----
        this.criarCampoTexto(xEsq, yEsq, 280, 38, "NICKNAME DO OPERADOR", this.configSala.hostNick, 'nick');

        if (!this.configSala.isSingleplayer) {
            yEsq += gapY;
            let lblVis = this.add.text(xEsq, yEsq - 22, "VISIBILIDADE DA SESSÃO", { fontSize: 13, color: "#8888aa", fontFamily: "Courier" });
            this.painelContainer.add(lblVis);
            
            this.criarBotaoEstilizado(xEsq, yEsq, 280, 38, this.configSala.isPrivate ? "PRIVADA (CÓDIGO)" : "PÚBLICA (BROWSER)", () => {
                this.configSala.isPrivate = !this.configSala.isPrivate; this.atualizarInterfaceAtual(); this.tocarSomCurto();
            });
        }

        yEsq += gapY;
        let lblModo = this.add.text(xEsq, yEsq - 22, "MODO DE JOGO", { fontSize: 13, color: "#8888aa", fontFamily: "Courier" });
        this.painelContainer.add(lblModo);

        this.criarBotaoEstilizado(xEsq, yEsq, 280, 38, this.configSala.modo, () => {
            const modos = ['HISTORIA', 'ESPECIFICO', 'HORARIO'];
            this.configSala.modo = modos[(modos.indexOf(this.configSala.modo) + 1) % modos.length];
            this.atualizarInterfaceAtual(); this.tocarSomCurto();
        });

        yEsq += gapY;
        if (this.configSala.modo === 'ESPECIFICO') {
            let lblMapa = this.add.text(xEsq + 20, yEsq - 25, "↳ SELECIONAR MAPA", { fontSize: 12, color: "#ff9900", fontFamily: "Courier" });
            this.painelContainer.add(lblMapa);

            this.criarBotaoEstilizado(xEsq + 20, yEsq + 10, 260, 32, "MAPA " + this.configSala.mapaId, () => {
                this.abrirOverlayMapas(); 
            }, 0x221100, 0xff9900);
        } else if (this.configSala.modo === 'HORARIO') {
            let lblMapa = this.add.text(xEsq + 20, yEsq - 25, "↳ TIPO DE MAPA", { fontSize: 12, color: "#ff9900", fontFamily: "Courier" });
            this.painelContainer.add(lblMapa);

            this.criarBotaoEstilizado(xEsq + 20, yEsq + 10, 260, 32, this.configSala.horarioTipo, () => {
                this.configSala.horarioTipo = this.configSala.horarioTipo === 'PLATAFORMAS' ? 'LABIRINTO' : 'PLATAFORMAS'; this.atualizarInterfaceAtual(); this.tocarSomCurto();
            }, 0x221100, 0xff9900);
        }

        // ---- COLUNA DIREITA (Personagens) ----
        let yDir = 125;
        let boxSize = 90; 
        
        let lblOp = this.add.text(xDir, yDir - 22, "SELECIONE O OPERADOR", { fontSize: 13, color: "#8888aa", fontFamily: "Courier" });
        this.painelContainer.add(lblOp);
        
        // --- CAIXA DO SOLAR ---
        let isSolar = this.configSala.hostPersonagem === 'solar';
        let bgSolar = this.add.rectangle(xDir, yDir, boxSize, boxSize, isSolar ? 0xff6600 : 0x111118, isSolar ? 0.2 : 1)
            .setOrigin(0, 0).setStrokeStyle(2, isSolar ? 0xff9900 : 0x444455).setInteractive({ useHandCursor: true });
        
        let txtSolar = this.add.text(xDir + boxSize/2, yDir + boxSize - 12, "SOLAR", { fontSize: 13, color: isSolar ? "#ff9900" : "#666677", fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0.5);
        this.painelContainer.add([bgSolar, txtSolar]);
        bgSolar.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); this.configSala.hostPersonagem = 'solar'; this.atualizarInterfaceAtual(); this.tocarSomCurto(); });

        // --- CAIXA DO FORNALHA ---
        let isForn = this.configSala.hostPersonagem === 'fornalha';
        let bgForn = this.add.rectangle(xDir + boxSize + 20, yDir, boxSize, boxSize, isForn ? 0xff6600 : 0x111118, isForn ? 0.2 : 1)
            .setOrigin(0, 0).setStrokeStyle(2, isForn ? 0xff9900 : 0x444455).setInteractive({ useHandCursor: true });
        
        let txtForn = this.add.text(xDir + boxSize + 20 + boxSize/2, yDir + boxSize - 12, "FORNALHA", { fontSize: 13, color: isForn ? "#ff9900" : "#666677", fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0.5);
        this.painelContainer.add([bgForn, txtForn]);
        bgForn.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); this.configSala.hostPersonagem = 'fornalha'; this.atualizarInterfaceAtual(); this.tocarSomCurto(); });

        // --- SPRITES DOS PERSONAGENS ---
        if (this.textures.exists('Personagens')) {
            let tex = this.textures.get('Personagens');
            
            if (!tex.has('preview_solar_frame') || !tex.has('preview_fornalha_frame')) {
                let img = tex.getSourceImage();
                let halfW = Math.floor(img.width / 2);
                let h = img.height;
                if (!tex.has('preview_solar_frame')) tex.add('preview_solar_frame', 0, 0, 0, halfW, h);
                if (!tex.has('preview_fornalha_frame')) tex.add('preview_fornalha_frame', 0, halfW, 0, halfW, h);
            }

            let spriteSolar = this.add.image(xDir + boxSize/2, yDir + boxSize/2 - 10, 'Personagens', 'preview_solar_frame').setOrigin(0.5).setScale(2.5);
            this.painelContainer.add(spriteSolar);

            let spriteFornalha = this.add.image(xDir + boxSize + 20 + boxSize/2, yDir + boxSize/2 - 10, 'Personagens', 'preview_fornalha_frame').setOrigin(0.5).setScale(2.5);
            this.painelContainer.add(spriteFornalha);
        }

        // --- PREVIEW DO MAPA ---
        if (this.configSala.modo === 'ESPECIFICO') {
            let yMap = yDir + boxSize + 25; 
            let lblPrev = this.add.text(xDir, yMap - 20, "PREVIEW DO TERRENO", { fontSize: 13, color: "#8888aa", fontFamily: "Courier" });
            this.painelContainer.add(lblPrev);
            
            let pW = 320; let pH = 135; 
            let bgMap = this.add.rectangle(xDir, yMap, pW, pH, 0x050608).setOrigin(0, 0).setStrokeStyle(1, 0x00f3ff, 0.5);
            this.painelContainer.add(bgMap);

            let imgKey = 'preview_mapa' + this.configSala.mapaId;
            if (this.textures.exists(imgKey)) {
                let imgMap = this.add.image(xDir + pW/2, yMap + pH/2, imgKey).setOrigin(0.5);
                let scale = Math.min((pW - 4) / imgMap.width, (pH - 4) / imgMap.height);
                imgMap.setScale(scale);
                this.painelContainer.add(imgMap);
            } else {
                this.painelContainer.add(this.add.text(xDir + pW/2, yMap + pH/2, "SINAL DE VÍDEO\nNÃO ENCONTRADO", { fontSize: 13, color: "#ff4444", fontFamily: "Courier", align: "center" }).setOrigin(0.5));
            }
        }

        // ---- AVISO DE USO EXCLUSIVO TECLADO/MOUSE ----
        let yAviso = this.scale.height - 75;
        let avisoTxt = this.add.text(50, yAviso, "⚠️ NOTA: Esta seção de configuração requer uso exclusivo de Teclado e Mouse.", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#ffaa00"
        }).setAlpha(0.8);
        this.painelContainer.add(avisoTxt);

        // ---- BOTÕES INFERIORES FIXADOS NO RODAPÉ ----
        let yBotao = this.scale.height - 30; 

        this.criarBotaoEstilizado(this.scale.width - 250, yBotao, 210, 40, "[ INICIALIZAR ]", () => {
            this.tocarSomCurto(); this.socket.emit('criarSala', this.configSala);
        }, 0x004422, 0x00ff66, "#00ff66");

        this.criarBotaoEstilizado(50, yBotao, 120, 40, "VOLTAR", () => {
            this.tocarSomCurto(); this.voltarProMenu();
        }, 0x330000, 0xff4444, "#ff4444");
    }

    construirInterfaceBrowser() {
        this.tituloTexto.setText("// SESSÕES PÚBLICAS ATIVAS");
        this.criarCampoTexto(50, 135, 300, 38, "NICKNAME DO OPERADOR", this.configSala.hostNick, 'nick');
        this.socket.emit('solicitarSalasPublicas');

        this.socket.off('listaSalasAtualizada');
        this.socket.on('listaSalasAtualizada', (lista) => {
            if(this.estadoCena !== "BROWSER") return;
            if(this.salasContainer) this.salasContainer.destroy();
            this.salasContainer = this.add.container(0, 0);
            this.painelContainer.add(this.salasContainer);

            let yOffset = 210;
            if (lista.length === 0) this.salasContainer.add(this.add.text(50, yOffset, "Nenhuma sessão pública detectada no radar...", {color: "#8888aa", fontFamily: "Courier"}));

            lista.forEach(sala => {
                let textoBtn = `HOST: ${sala.hostNick}  |  MODO: ${sala.modo}  >> ENTRAR`;
                let btn = this.add.rectangle(50, yOffset, 550, 40, 0x141624).setOrigin(0, 0.5).setStrokeStyle(1, 0x00f3ff).setInteractive({ useHandCursor: true });
                let txt = this.add.text(70, yOffset, textoBtn, { fontSize: 15, color: "#ffffff", fontFamily: "Courier", fontStyle: "bold" }).setOrigin(0, 0.5);
                
                btn.on('pointerover', () => btn.setFillStyle(0x00f3ff, 0.2));
                btn.on('pointerout', () => btn.setFillStyle(0x141624, 1));
                btn.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); this.tocarSomCurto(); this.socket.emit('entrarSala', { salaId: sala.id, nick: this.configSala.hostNick }); });

                this.salasContainer.add([btn, txt]);
                yOffset += 55;
            });
        });

        this.criarBotaoEstilizado(this.scale.width - 250, 135, 210, 40, "[ ATUALIZAR RADAR ]", () => { this.tocarSomCurto(); this.socket.emit('solicitarSalasPublicas'); });
        
        let yAviso = this.scale.height - 75;
        let avisoTxt = this.add.text(50, yAviso, "⚠️ NOTA: Esta seção de configuração requer uso exclusivo de Teclado e Mouse.", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#ffaa00"
        }).setAlpha(0.8);
        this.painelContainer.add(avisoTxt);

        this.criarBotaoEstilizado(50, this.scale.height - 30, 120, 40, "VOLTAR", () => { this.tocarSomCurto(); this.voltarProMenu(); }, 0x330000, 0xff4444, "#ff4444");
    }

    construirInterfaceCodigo() {
        this.tituloTexto.setText("// CONEXÃO SEGURA POR CÓDIGO");
        this.criarCampoTexto(50, 135, 300, 40, "NICKNAME DO OPERADOR", this.configSala.hostNick, 'nick');
        this.criarCampoTexto(50, 220, 300, 40, "CÓDIGO DA SESSÃO", this.codigoDigitado, 'codigo');

        this.criarBotaoEstilizado(370, 220, 180, 40, "CONECTAR >>", () => {
            if(this.codigoDigitado.length > 0) {
                this.tocarSomCurto();
                this.socket.emit('entrarSala', { salaId: this.codigoDigitado, nick: this.configSala.hostNick });
            }
        }, 0x004422, 0x00ff66, "#00ff66");

        let yAviso = this.scale.height - 75;
        let avisoTxt = this.add.text(50, yAviso, "⚠️ NOTA: Esta seção de configuração requer uso exclusivo de Teclado e Mouse.", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#ffaa00"
        }).setAlpha(0.8);
        this.painelContainer.add(avisoTxt);

        this.criarBotaoEstilizado(50, this.scale.height - 30, 120, 40, "VOLTAR", () => { this.tocarSomCurto(); this.voltarProMenu(); }, 0x330000, 0xff4444, "#ff4444");
    }

    construirInterfaceLobby() {
        const isHost = this.salaAtual.hostId === this.socket.id;
        this.tituloTexto.setText(`// LOBBY ${this.salaAtual.isSingleplayer ? "OFFLINE" : "MULTIPLAYER"} - SESSÃO: [ ${this.salaAtual.id} ]`);

        let yP1 = 130; 
        let yP2 = 230;

        Object.entries(this.salaAtual.jogadores).forEach(([id, dados], index) => {
            let yPos = index === 0 ? yP1 : yP2;
            let status = isHost && id === this.socket.id ? " (HOST)" : "";
            
            let bgPlayer = this.add.rectangle(50, yPos, 400, 80, 0x141624).setOrigin(0, 0).setStrokeStyle(1.5, 0x00f3ff);
            let txtInfos = `OPERADOR: ${dados.personagem.toUpperCase()}\nNICK: ${dados.nick}${status}`;
            let txtNode = this.add.text(140, yPos + 40, txtInfos, { fontFamily: "Courier", color: "#fff", fontSize: 16, fontStyle: "bold" }).setOrigin(0, 0.5);
            
            this.painelContainer.add([bgPlayer, txtNode]);

            if (this.textures.exists('Personagens')) {
                let tex = this.textures.get('Personagens');
                
                if (!tex.has('preview_solar_frame') || !tex.has('preview_fornalha_frame')) {
                    let img = tex.getSourceImage();
                    let halfW = Math.floor(img.width / 2);
                    let h = img.height;
                    if (!tex.has('preview_solar_frame')) tex.add('preview_solar_frame', 0, 0, 0, halfW, h);
                    if (!tex.has('preview_fornalha_frame')) tex.add('preview_fornalha_frame', 0, halfW, 0, halfW, h);
                }

                let isSolar = dados.personagem === 'solar';
                let frameKey = isSolar ? 'preview_solar_frame' : 'preview_fornalha_frame';

                if(tex.has(frameKey)) {
                    let pSprite = this.add.image(95, yPos + 40, 'Personagens', frameKey).setOrigin(0.5).setScale(2.5);
                    this.painelContainer.add(pSprite);
                }
            }
        });

        if (Object.keys(this.salaAtual.jogadores).length < 2 && !this.salaAtual.isSingleplayer) {
            let lblAguardando = this.add.text(50, yP2 + 40, "Aguardando conexão de segundo operador...", {color: "#8888aa", fontFamily: "Courier", fontStyle: "italic"}).setOrigin(0, 0.5);
            this.painelContainer.add(lblAguardando);
        }

        // ---- CONTROLES DE LOBBY ----
        let yBotao = this.scale.height - 30;
        
        if (isHost) {
            if (this.salaAtual.isSingleplayer || Object.keys(this.salaAtual.jogadores).length === 2) {
                this.criarBotaoEstilizado(this.scale.width - 250, yBotao, 210, 40, "[ INICIAR SEQUENCIA ]", () => { this.tocarSomCurto(); this.socket.emit('iniciarPartida'); }, 0x004422, 0x00ff66, "#00ff66");
            } else {
                let btnLckBg = this.add.rectangle(this.scale.width - 250, yBotao, 210, 40, 0x1a1a24).setOrigin(0, 0.5).setStrokeStyle(1.5, 0x555566);
                let btnLckTxt = this.add.text(this.scale.width - 250 + 105, yBotao, "[ ESPERANDO JOGADOR ]", {color: "#555566", fontFamily: "Courier", fontStyle: "bold"}).setOrigin(0.5);
                this.painelContainer.add([btnLckBg, btnLckTxt]);
            }
        }

        this.criarBotaoEstilizado(50, yBotao, 220, 40, "[ DESCONECTAR / VOLTAR ]", () => {
            this.tocarSomCurto(); this.socket.emit('sairDaSala'); this.voltarProMenu();
        }, 0x330000, 0xff4444, "#ff4444");
    }

    voltarProMenu() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start("MainMenu");
        });
    }
}
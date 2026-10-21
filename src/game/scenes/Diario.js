import { Scene } from "phaser";

export class Diario extends Scene {
    constructor() {
        super('Diario');
    }

    init(data) {
        this.offsetDias = data ? (data.offsetDias || 0) : 0;
        this.personagemInicial = data ? (data.personagem || 'solar') : 'solar';
        this.modoDiario = data ? (data.modoDiario || 'PLATAFORMAS') : 'PLATAFORMAS'; 
    }

    create() {
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ==========================================
        // 0. CONEXÃO SOCKET.IO & MULTIPLAYER
        // ==========================================
        this.socket = this.game.socket;
        this.outroPersonagemTipo = this.personagemInicial === 'solar' ? 'fornalha' : 'solar';

        if (this.socket) {
            this.socket.off('voltarAoMenuGeral'); 
            this.socket.on('voltarAoMenuGeral', () => {
                this.voltarParaMenu();
            });
        }

        // ==========================================
        // SEMENTE ÚNICA SINCRONIZADA POR DIA + MODO
        // ==========================================
        const dataSimulada = new Date();
        dataSimulada.setDate(dataSimulada.getDate() + this.offsetDias);
        
        let hashModo = 0;
        for (let i = 0; i < this.modoDiario.length; i++) {
            hashModo += this.modoDiario.charCodeAt(i);
        }

        let currentSeed = (dataSimulada.getUTCFullYear() * 10000) + 
                           ((dataSimulada.getUTCMonth() + 1) * 100) + 
                           dataSimulada.getUTCDate() + 
                           this.offsetDias + 
                           (hashModo * 777);

        const randomDiario = () => {
            let t = currentSeed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };

        // ==========================================
        // 1. TILESETS E CAMADAS
        // ==========================================
        const map = this.make.tilemap({ key: 'mapa' });

        const arrayTilesets = [
            map.addTilesetImage('Personagens', 'Personagens'),
            map.addTilesetImage('texturas_tileset1', 'texturas_tileset1'),
            map.addTilesetImage('TilesPedra', 'TilesPedra'),
            map.addTilesetImage('Espinhos', 'Espinhos')
        ].filter(ts => ts !== null);

        this.add.tileSprite(0, 0, map.widthInPixels, map.heightInPixels, 'FundoMetal')
            .setOrigin(0, 0)
            .setDepth(-10);

        const layerPedras = map.createLayer('Pedras', arrayTilesets, 0, 0);
        const layerLimites = map.createLayer('Limites', arrayTilesets, 0, 0);
        const layerObjetos = map.createLayer('Objetos', arrayTilesets, 0, 0);

        if (this.cache.audio.has('som_queda')) {
            this.somQueda = this.sound.add('som_queda');
        }

        const BASE_TEXTURAS1 = 3;
        const ID_BLOCO_BRANCO = BASE_TEXTURAS1 + 17;
        const ID_BLOCO_PRETO  = BASE_TEXTURAS1 + 38;

        const COR_MAPA_HOJE = randomDiario() > 0.5 ? ID_BLOCO_BRANCO : ID_BLOCO_PRETO;

        const larg = map.width;
        const alt = map.height;

        for (let x = 0; x < larg; x++) {
            for (let y = 0; y < alt; y++) {
                layerLimites.removeTileAt(x, y);
                layerObjetos.removeTileAt(x, y);
                layerPedras?.removeTileAt(x, y);
            }
        }

        let ySolar = 15;
        let yFornalha = 15;

        // ==========================================
        // 2. MOTORES DE GERAÇÃO PROCEDURAL
        // ==========================================

        if (this.modoDiario === 'PLATAFORMAS') {
            for (let x = 0; x < larg; x++) {
                for (let y = 0; y < alt; y++) {
                    if (x === 0 || x === larg - 1 || y === 0) {
                        layerLimites.putTileAt(COR_MAPA_HOJE, x, y);
                    }
                }
            }

            ySolar = Math.floor(randomDiario() * (alt - 20)) + 10;
            yFornalha = Math.floor(randomDiario() * (alt - 20)) + 10;

            for (let x = 1; x <= 10; x++) {
                layerLimites.putTileAt(COR_MAPA_HOJE, x, ySolar); 
                layerLimites.putTileAt(COR_MAPA_HOJE, x, ySolar - 6); 
            }
            for (let y = ySolar - 5; y < ySolar; y++) layerLimites.putTileAt(COR_MAPA_HOJE, 1, y);

            for (let x = larg - 11; x < larg - 1; x++) {
                layerLimites.putTileAt(COR_MAPA_HOJE, x, yFornalha); 
                layerLimites.putTileAt(COR_MAPA_HOJE, x, yFornalha - 6); 
            }
            for (let y = yFornalha - 5; y < yFornalha; y++) layerLimites.putTileAt(COR_MAPA_HOJE, larg - 2, y);

            let startX = 12;
            let endX = larg - 13;
            let totalPassos = endX - startX;
            
            for (let x = startX; x <= endX; x += Math.floor(randomDiario() * 3) + 3) {
                let progresso = (x - startX) / totalPassos;
                let targetY = ySolar + Math.round((yFornalha - ySolar) * progresso);
                let currentY = targetY + (Math.floor(randomDiario() * 7) - 3);

                if (currentY < 5) currentY = 5;
                if (currentY > alt - 5) currentY = alt - 5;

                let larguraPlat = Math.floor(randomDiario() * 3) + 2;
                for (let i = 0; i < larguraPlat; i++) {
                    if (x + i <= endX) layerLimites.putTileAt(COR_MAPA_HOJE, x + i, currentY); 
                }

                if (randomDiario() > 0.5) {
                    let pilarAltura = Math.floor(randomDiario() * 4) + 3;
                    let pilarX = x + larguraPlat;
                    if (pilarX <= endX - 2) { 
                        for (let p = 0; p < pilarAltura; p++) {
                            layerLimites.putTileAt(COR_MAPA_HOJE, pilarX, currentY - p);
                        }
                    }
                }
            }

        } else if (this.modoDiario === 'LABIRINTO') {
            for (let x = 0; x < larg; x++) {
                for (let y = 0; y < alt; y++) {
                    layerLimites.putTileAt(COR_MAPA_HOJE, x, y);
                }
            }

            ySolar = 6;
            yFornalha = alt - 6;

            const passo = 4;
            for (let x = 3; x < larg - 3; x += passo) {
                for (let y = 3; y < alt - 3; y += passo) {
                    for (let cx = 0; cx < 3; cx++) {
                        for (let cy = 0; cy < 3; cy++) {
                            layerLimites.removeTileAt(x + cx, y + cy);
                        }
                    }

                    if (randomDiario() > 0.35 && x + passo < larg - 3) {
                        for (let k = 0; k < passo; k++) {
                            layerLimites.removeTileAt(x + k, y);
                            layerLimites.removeTileAt(x + k, y + 1);
                        }
                    }
                    if (randomDiario() > 0.35 && y + passo < alt - 3) {
                        for (let k = 0; k < passo; k++) {
                            layerLimites.removeTileAt(x, y + k);
                            layerLimites.removeTileAt(x + 1, y + k);
                        }
                    }
                }
            }

            for (let x = 1; x <= 10; x++) {
                for (let y = ySolar - 3; y <= ySolar + 1; y++) {
                    layerLimites.removeTileAt(x, y);
                }
                layerLimites.putTileAt(COR_MAPA_HOJE, x, ySolar + 2);
            }

            for (let x = larg - 11; x < larg - 1; x++) {
                for (let y = yFornalha - 3; y <= yFornalha + 1; y++) {
                    layerLimites.removeTileAt(x, y);
                }
                layerLimites.putTileAt(COR_MAPA_HOJE, x, yFornalha + 2);
            }
        }

        layerLimites.setCollisionByExclusion([-1]);
        layerObjetos.setCollisionByExclusion([-1]);
        
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, false);

        // ==========================================
        // 3. SPAWN DE PERSONAGENS & TELEPORTADORES
        // ==========================================
        const TW = map.tileWidth;
        const TH = map.tileHeight;

        const posicoesSpawn = {
            solar: { x: (4 * TW) + (TW / 2), y: (ySolar - 2) * TH },
            fornalha: { x: ((larg - 6) * TW) + (TW / 2), y: (yFornalha - 2) * TH }
        };

        const coordLocal = posicoesSpawn[this.personagemInicial];
        const chaveLocal = this.personagemInicial === 'solar' ? 'solar_andando' : 'Fornalha';

        this.jogadorAtual = this.physics.add.sprite(coordLocal.x, coordLocal.y, chaveLocal);
        this.jogadorAtual.setCircle(8).setCollideWorldBounds(true);
        this.jogadorAtual.spawnX = this.jogadorAtual.x;
        this.jogadorAtual.spawnY = this.jogadorAtual.y;
        this.jogadorAtual.estaRenascendo = false;

        const coordOutro = posicoesSpawn[this.outroPersonagemTipo];
        const chaveSpriteOutro = this.outroPersonagemTipo === 'solar' ? 'solar_andando' : 'Fornalha';

        this.outroSprite = this.add.sprite(coordOutro.x, coordOutro.y, chaveSpriteOutro).setAlpha(0.9).setDepth(50);
        this.outroSprite.setVisible(false);

        if (this.socket) {
            this.socket.off('atualizarPosicoes');
            this.socket.on('atualizarPosicoes', (posicoes) => {
                if (!posicoes) return;
                const dadosOutro = posicoes[this.outroPersonagemTipo];
                if (dadosOutro && this.outroSprite) {
                    this.outroSprite.x = dadosOutro.x;
                    this.outroSprite.y = dadosOutro.y;
                    this.outroSprite.setVisible(true);
                }
            });
        }

        this.mapaAlturaTotal = map.heightInPixels;

        this.teleporters = this.physics.add.staticGroup();
        const teleporter1 = this.teleporters.create(3 * TW, (ySolar - 1) * TH, 'corredorEsquerdo').setVisible(false);
        const teleporter2 = this.teleporters.create((larg - 4) * TW, (yFornalha - 1) * TH, 'corredorDireito').setVisible(false);

        // ==========================================
        // 4. MODO ESCURO DINÂMICO (HOLOFOTE NO PERSONAGEM)
        // ==========================================
        this.escuroAtivo = false;
        
        // Render Texture cobrindo a viewport inteira
        this.overlayEscuro = this.add.renderTexture(0, 0, this.scale.width, this.scale.height)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(150)
            .setVisible(false);

        // Forma geométrica utilizada para recortar o buraco de luz
        this.luzSpotlight = this.make.graphics({ add: false });
        this.luzSpotlight.fillStyle(0xffffff, 1);
        this.luzSpotlight.fillCircle(0, 0, 90); // Raio de visão de 90px em volta do jogador

        // ==========================================
        // HUD DA MÁQUINA DO TEMPO
        // ==========================================
        let stringData = dataSimulada.toLocaleDateString();
        let textoOffset = this.offsetDias === 0 ? "HOJE" : (this.offsetDias > 0 ? `+${this.offsetDias} DIA(S)` : `${this.offsetDias} DIA(S)`);

        this.add.text(40, 25, `MAPA DIÁRIO: ${textoOffset} (${stringData})`, {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", stroke: "#000000", strokeThickness: 3
        }).setScrollFactor(0).setDepth(200);

        this.add.text(40, 48, "[E] MODO ESCURO | [+] PROX DIA | [-] DIA ANTERIOR | [ESC] MENU", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#8888aa", stroke: "#000000", strokeThickness: 2
        }).setScrollFactor(0).setDepth(200);

        // ==========================================
        // 5. FÍSICAS E ANIMAÇÕES
        // ==========================================
        this.physics.add.collider(this.jogadorAtual, layerLimites);
        this.physics.add.collider(this.jogadorAtual, layerObjetos);

        const teleporterAlvo = this.personagemInicial === 'solar' ? teleporter2 : teleporter1;
        this.physics.add.overlap(this.jogadorAtual, teleporterAlvo, this.completouMapaDiario, null, this);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.jogadorAtual);

        this.configurarAnimacoes();
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.jaEstaSaindo = false;

        // ==========================================
        // 6. EVENTOS DE TECLADO (E, +, -, ESC)
        // ==========================================
        this.input.keyboard.on('keydown', (event) => {
            if (this.jaEstaSaindo) return;

            // Alternar escuro com 'E'
            if (event.key === 'e' || event.key === 'E') {
                this.escuroAtivo = !this.escuroAtivo;
                this.overlayEscuro.setVisible(this.escuroAtivo);
            }

            // Próximo dia com '+' ou '='
            if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
                this.scene.restart({ 
                    offsetDias: this.offsetDias + 1, 
                    personagem: this.personagemInicial, 
                    modoDiario: this.modoDiario 
                });
            }

            // Dia anterior com '-'
            if (event.key === '-' || event.code === 'NumpadSubtract') {
                this.scene.restart({ 
                    offsetDias: this.offsetDias - 1, 
                    personagem: this.personagemInicial, 
                    modoDiario: this.modoDiario 
                });
            }

            // Voltar ao menu com ESC
            if (event.key === 'Escape') {
                this.voltarParaMenu();
            }
        });
    }

    configurarAnimacoes() {
        if (!this.anims.exists('walk')) this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('solar_andando', { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
        if (!this.anims.exists('run')) this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('solar_correndo', { start: 1, end: 2 }), frameRate: 15 });
        if (!this.anims.exists('jump')) this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('solar_pulando', { start: 2, end: 2 }), frameRate: 100 });
        if (!this.anims.exists('fall')) this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('solar_caindo', { start: 2, end: 2 }), frameRate: 10 });
        if (!this.anims.exists('wallSlide')) this.anims.create({ key: 'wallSlide', frames: this.anims.generateFrameNumbers('solar_deslizando', { start: 1, end: 1 }), frameRate: 10 });
    }

    update() {
        if (this.jaEstaSaindo) return; 

        const limiteQueda = this.mapaAlturaTotal + 40; 
        
        if (this.jogadorAtual && this.jogadorAtual.y > limiteQueda && !this.jogadorAtual.estaRenascendo) {
            this.jogadorAtual.estaRenascendo = true;

            if (this.somQueda) {
                this.somQueda.stop();
                this.somQueda.play();
            } else if (this.cache.audio.has('caindo')) {
                this.sound.play('caindo');
            }

            this.cameras.main.stopFollow();
            this.jogadorAtual.setVisible(false);
            if (this.jogadorAtual.body) this.jogadorAtual.body.setEnable(false);

            this.time.delayedCall(1500, () => {
                if (this.somQueda) this.somQueda.stop();
                if (this.cache.audio.has('caindo')) {
                    this.sound.stopByKey('caindo');
                    this.sound.getAll('caindo').forEach(s => s.stop());
                }

                this.jogadorAtual.setPosition(this.jogadorAtual.spawnX, this.jogadorAtual.spawnY);
                this.jogadorAtual.setVelocity(0, 0);
                this.jogadorAtual.setVisible(true);
                if (this.jogadorAtual.body) this.jogadorAtual.body.setEnable(true);
                this.jogadorAtual.estaRenascendo = false;

                this.cameras.main.startFollow(this.jogadorAtual);
            });
        }

        // ==========================================
        // ESCURIDÃO COM FURO CIRCULAR
        // ==========================================
        const largura = 2500;
        const altura = 2500;
        const raioLuz = 24;

        if (!this.textures.exists('escuridaoComFuro')) {
            const canvasTexture = this.textures.createCanvas('escuridaoComFuro', largura, altura);
            const ctx = canvasTexture.context;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, largura, altura);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(largura / 2, altura / 2, raioLuz, 0, Math.PI * 2);
            ctx.fill();

            canvasTexture.refresh();
        }
        const activePlayer = this.jogadorAtual;
        if (!activePlayer || !activePlayer.body || activePlayer.estaRenascendo) return;

        if (this.socket) {
            this.socket.emit('enviarPosicao', {
                x: activePlayer.x,
                y: activePlayer.y
            });
        }

        const body = activePlayer.body;
        this.apertouW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.apertouA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.apertouD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.apertouShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        let indoEsquerda = this.cursors.left.isDown || this.apertouA.isDown;
        let indoDireita = this.cursors.right.isDown || this.apertouD.isDown;
        let tentouPular = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.apertouW.isDown;
        let estaCorrendo = this.apertouShift.isDown;

        // ==========================================
        // MAPEAMENTO DO CONTROLE SUPER NINTENDINHO
        // ==========================================
        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;

        const isBtnPressed = (padObj, index) => {
            if (!padObj || !padObj.buttons || !padObj.buttons[index]) return false;
            return padObj.buttons[index].pressed || padObj.buttons[index].value > 0.5;
        };

        if (pad) {
            const axisX = pad.leftStick ? pad.leftStick.x : 0;
            if (axisX < -0.2 || pad.left || isBtnPressed(pad, 14)) indoEsquerda = true;
            if (axisX > 0.2 || pad.right || isBtnPressed(pad, 15)) indoDireita = true;

            // PULAR: Botão B (Amarelo / debaixo - index 0)
            if (isBtnPressed(pad, 2)) {
                tentouPular = true;
            }

            // CORRER: Botão RB / R (Gatilho de ombro direito - index 5)
            if (isBtnPressed(pad, 6) || isBtnPressed(pad, 3)) {
                estaCorrendo = true;
            }

            // VOLTAR AO MENU: Botão A (Vermelho / direita - index 1) ou SELECT (index 8)
            if (isBtnPressed(pad, 1) || isBtnPressed(pad, 8)) {
                this.voltarParaMenu();
                return;
            }
        }

        const noChao = body.blocked.down || body.touching.down || body.onFloor();
        const isTouchingWall = body.blocked.left || body.blocked.right;
        const isFalling = body.velocity.y > 0;
        const estaNaParede = isTouchingWall && !noChao && isFalling;

        let executouWallJump = false;
        const velocidadeX = estaCorrendo ? 260 : 160; 
        const impulsoParedeX = estaCorrendo ? 320 : 220; 

        if (tentouPular && noChao) activePlayer.setVelocityY(-400); 
        if (estaNaParede) activePlayer.setVelocityY(50); 

        if (tentouPular && estaNaParede) {
            executouWallJump = true;
            if (indoDireita) { activePlayer.setVelocityX(impulsoParedeX); activePlayer.setVelocityY(-380); }
            else if (indoEsquerda) { activePlayer.setVelocityX(-impulsoParedeX); activePlayer.setVelocityY(-380); }
        }

        if (!executouWallJump) {
            if (indoEsquerda) { activePlayer.setVelocityX(-velocidadeX); activePlayer.setFlipX(true); } 
            else if (indoDireita) { activePlayer.setVelocityX(velocidadeX); activePlayer.setFlipX(false); } 
            else { activePlayer.setVelocityX(0); }
        }

        if (this.personagemInicial === 'solar') {
            if (isTouchingWall && !noChao && isFalling) activePlayer.anims.play('wallSlide', true);
            else if (!noChao && Math.abs(body.velocity.y) > 15) {
                if (body.velocity.y < 0) activePlayer.anims.play('jump', true);
                else activePlayer.anims.play('fall', true);
            } 
            else if (body.velocity.x !== 0) {
                if (estaCorrendo) activePlayer.anims.play('run', true);
                else activePlayer.anims.play('walk', true);
            } 
            else {
                activePlayer.anims.stop();
                activePlayer.setTexture('solar_andando', 0); 
            }
        }
    }

    executarTransicaoSaida() {
        if (this.somQueda) this.somQueda.stop();
        if (this.cache.audio.has('caindo')) {
            this.sound.stopByKey('caindo');
        }
        this.cameras.main.fadeOut(500, 0, 0, 0); 
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (this.scene.isActive('Diario')) {
                this.scene.stop('Diario');
                this.scene.start('MainMenu');
            }
        });
    }

    voltarParaMenu() {
        if (this.jaEstaSaindo) return;
        this.jaEstaSaindo = true;
        this.executarTransicaoSaida();
    }

    completouMapaDiario(jogador, teleportador) {
        if (this.jaEstaSaindo) return;
        this.jaEstaSaindo = true;
        
        if (this.socket) {
            this.socket.emit('faseDiarioConcluida');
        }

        if (this.jogadorAtual && this.jogadorAtual.body) {
            this.jogadorAtual.setVelocity(0, 0);
            this.jogadorAtual.body.setEnable(false);
        }

        const width = this.scale.width;
        const height = this.scale.height;

        const containerVitoria = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);

        const fundo = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0, 0);
        containerVitoria.add(fundo);

        const nomeVencedor = this.personagemInicial.toUpperCase();

        let spriteVencedor;
        if (this.textures.exists('Personagens')) {
            const tex = this.textures.get('Personagens');
            const img = tex.getSourceImage();
            const halfW = Math.floor(img.width / 2);
            const h = img.height;

            const frameKey = (this.personagemInicial === 'solar') ? 'preview_solar_frame' : 'preview_fornalha_frame';
            if (!tex.has(frameKey)) {
                const frameX = (this.personagemInicial === 'solar') ? 0 : halfW;
                tex.add(frameKey, 0, frameX, 0, halfW, h);
            }
            spriteVencedor = this.add.image(width / 2, height / 2 - 50, 'Personagens', frameKey).setDisplaySize(140, 140);
        } else {
            const chaveSprite = this.personagemInicial === 'solar' ? 'solar_andando' : 'Fornalha';
            spriteVencedor = this.add.sprite(width / 2, height / 2 - 50, chaveSprite, 0).setDisplaySize(140, 140);
        }
        containerVitoria.add(spriteVencedor);

        const textoVitoria = this.add.text(width / 2, height / 2 + 50, `${nomeVencedor} VENCEU!`, {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 32,
            color: "#00ff66",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);
        containerVitoria.add(textoVitoria);

        this.tweens.add({
            targets: textoVitoria,
            scale: { from: 0.8, to: 1.1 },
            duration: 400,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        this.time.delayedCall(3000, () => {
            this.executarTransicaoSaida();
        });
    }
}
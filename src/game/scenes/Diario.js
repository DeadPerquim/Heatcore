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

        this.socket = this.game.socket;
        this.outroPersonagemTipo = this.personagemInicial === 'solar' ? 'fornalha' : 'solar';

        if (this.socket) {
            this.socket.off('voltarAoMenuGeral'); 
            this.socket.on('voltarAoMenuGeral', () => {
                this.voltarParaMenu();
            });
        }

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

            let startX = 2;
            let endX = larg - 3;

            for (let x = startX; x <= endX; x++) {
                let progresso = (x - startX) / (endX - startX);
                let targetY = ySolar + (yFornalha - ySolar) * progresso;
                let noise = (Math.floor(randomDiario() * 5) - 2); 
                let currentY = Math.round(targetY + noise);
                
                if (currentY < 4) currentY = 4;
                if (currentY > alt - 4) currentY = alt - 4;

                for (let dy = -2; dy <= 2; dy++) {
                    layerLimites.removeTileAt(x, currentY + dy);
                }
            }

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
                    if ((dadosOutro.x === 0 && dadosOutro.y === 0) || (dadosOutro.cena && dadosOutro.cena !== this.scene.key)) {
                        this.outroSprite.setVisible(false);
                    } else {
                        this.outroSprite.x = dadosOutro.x;
                        this.outroSprite.y = dadosOutro.y;
                        this.outroSprite.setVisible(true);

                        if (this.timeoutOutroJogador) clearTimeout(this.timeoutOutroJogador);
                        this.timeoutOutroJogador = setTimeout(() => {
                            if (this.outroSprite) this.outroSprite.setVisible(false);
                        }, 2500);
                    }
                }
            });
        }

        this.mapaAlturaTotal = map.heightInPixels;

        this.teleporters = this.physics.add.staticGroup();
        const teleporter1 = this.teleporters.create(3 * TW, (ySolar - 1) * TH, 'corredorEsquerdo').setVisible(false);
        const teleporter2 = this.teleporters.create((larg - 4) * TW, (yFornalha - 1) * TH, 'corredorDireito').setVisible(false);

        const larguraEscuro = 2500;
        const alturaEscuro = 2500;
        const raioLuz = 24;

        if (!this.textures.exists('escuridaoComFuro')) {
            const canvasTexture = this.textures.createCanvas('escuridaoComFuro', larguraEscuro, alturaEscuro);
            const ctx = canvasTexture.context;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, larguraEscuro, alturaEscuro);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(larguraEscuro / 2, alturaEscuro / 2, raioLuz, 0, Math.PI * 2);
            ctx.fill();
            canvasTexture.refresh();
        }
        
        this.escuroAtivo = false;
        this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuro').setDepth(150).setVisible(false);

        this.physics.add.collider(this.jogadorAtual, layerLimites);
        this.physics.add.collider(this.jogadorAtual, layerObjetos);

        const teleporterAlvo = this.personagemInicial === 'solar' ? teleporter2 : teleporter1;
        this.physics.add.overlap(this.jogadorAtual, teleporterAlvo, this.completouMapaDiario, null, this);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.jogadorAtual);
        this.cameras.main.setZoom(1); 

        this.configurarAnimacoes();
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.jaEstaSaindo = false;

        this.input.keyboard.on('keydown', (event) => {
            if (this.jaEstaSaindo) return;
            if (event.key === 'e' || event.key === 'E') {
                this.escuroAtivo = !this.escuroAtivo;
                if (this.escuridaoSprite) {
                    this.escuridaoSprite.setVisible(this.escuroAtivo);
                }
            }
            if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
                this.scene.restart({ offsetDias: this.offsetDias + 1, personagem: this.personagemInicial, modoDiario: this.modoDiario });
            }
            if (event.key === '-' || event.code === 'NumpadSubtract') {
                this.scene.restart({ offsetDias: this.offsetDias - 1, personagem: this.personagemInicial, modoDiario: this.modoDiario });
            }
            if (event.key === 'Escape') {
                this.voltarParaMenu();
            }
        });

        // CONTAINER TRAVADO NA TELA
        this.uiContainer = this.add.container(0, 0).setDepth(190);
        this.uiContainer.setScrollFactor(0);

        let stringData = dataSimulada.toLocaleDateString();
        let textoOffset = this.offsetDias === 0 ? "HOJE" : (this.offsetDias > 0 ? `+${this.offsetDias} DIA(S)` : `${this.offsetDias} DIA(S)`);

        const txtData = this.add.text(40, 25, `MAPA DIÁRIO: ${textoOffset} (${stringData})`, {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", stroke: "#000000", strokeThickness: 3
        });
        this.uiContainer.add(txtData);

        this.adicionarFiltroVisao();
    }

    adicionarFiltroVisao() {
        const sw = this.scale.width;
        const sh = this.scale.height;
        const uiContainer = this.uiContainer;

        if (this.personagemInicial === 'solar') {
            if (!this.textures.exists('vinheta_solar')) {
                const canvas = this.textures.createCanvas('vinheta_solar', sw, sh);
                const ctx = canvas.context;
                let grad = ctx.createRadialGradient(sw/2, sh/2, sh/4, sw/2, sh/2, sw/1.5);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0, 243, 255, 0.12)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, sw, sh);
                canvas.refresh();
            }
            uiContainer.add(this.add.image(0, 0, 'vinheta_solar').setOrigin(0,0));

            if (!this.textures.exists('grid_solar')) {
                const gridCanvas = this.textures.createCanvas('grid_solar', sw, sh);
                const ctx = gridCanvas.context;
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.03)';
                ctx.lineWidth = 1;
                for (let x = 0; x < sw; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, sh); ctx.stroke(); }
                for (let y = 0; y < sh; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sw, y); ctx.stroke(); }
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
                ctx.lineWidth = 2;
                for (let x = 0; x < sw; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, sh); ctx.stroke(); }
                for (let y = 0; y < sh; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sw, y); ctx.stroke(); }
                gridCanvas.refresh();
            }
            uiContainer.add(this.add.image(0, 0, 'grid_solar').setOrigin(0,0));

            let g = this.add.graphics();
            g.lineStyle(2, 0x00f3ff, 0.5);
            g.beginPath();
            g.moveTo(20, 50); g.lineTo(20, 20); g.lineTo(50, 20);
            g.moveTo(sw - 50, 20); g.lineTo(sw - 20, 20); g.lineTo(sw - 20, 50);
            g.moveTo(20, sh - 50); g.lineTo(20, sh - 20); g.lineTo(50, sh - 20);
            g.moveTo(sw - 50, sh - 20); g.lineTo(sw - 20, sh - 20); g.lineTo(sw - 20, sh - 50);
            g.strokePath();

            g.fillStyle(0x00f3ff, 0.4);
            g.fillCircle(sw/2, 20, 2); g.fillCircle(sw/2, sh - 20, 2);
            g.fillCircle(20, sh/2, 2); g.fillCircle(sw - 20, sh/2, 2);
            uiContainer.add(g);
        } else {
            if (!this.textures.exists('vinheta_fornalha')) {
                const canvas = this.textures.createCanvas('vinheta_fornalha', sw, sh);
                const ctx = canvas.context;
                let grad = ctx.createRadialGradient(sw/2, sh/2, sh/4, sw/2, sh/2, sw/1.5);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(210, 160, 0, 0.18)'); 
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, sw, sh);
                canvas.refresh();
            }
            uiContainer.add(this.add.image(0, 0, 'vinheta_fornalha').setOrigin(0,0));

            let g = this.add.graphics();
            const drawScrap = (x, y, multX, multY) => {
                g.fillStyle(0x2d170e, 0.9);
                g.beginPath();
                g.moveTo(x, y); g.lineTo(x + (120 * multX), y); g.lineTo(x, y + (120 * multY));
                g.closePath(); g.fillPath();
                g.fillStyle(0x4a1c11, 0.95);
                g.beginPath();
                g.moveTo(x, y); g.lineTo(x + (75 * multX), y); g.lineTo(x, y + (75 * multY));
                g.closePath(); g.fillPath();
                g.fillStyle(0x6b2b11, 1);
                g.fillRect(multX > 0 ? x : x - 20, multY > 0 ? y : y - 90, 20, 90);
                g.fillRect(multX > 0 ? x : x - 90, multY > 0 ? y : y - 20, 90, 20);
                g.fillStyle(0x8a9294, 1);
                g.fillCircle(x + (12 * multX), y + (12 * multY), 4);
                g.fillCircle(x + (45 * multX), y + (10 * multY), 3);
                g.fillCircle(x + (10 * multX), y + (45 * multY), 3);
            };
            drawScrap(0, 0, 1, 1);
            drawScrap(sw, 0, -1, 1);
            drawScrap(0, sh, 1, -1);
            drawScrap(sw, sh, -1, -1);
            uiContainer.add(g);

            if (!this.textures.exists('scanlines_fornalha')) {
                const scanCanvas = this.textures.createCanvas('scanlines_fornalha', sw, sh);
                const ctx = scanCanvas.context;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                for (let y = 0; y < sh; y += 6) {
                    ctx.fillRect(0, y, sw, 2);
                }
                scanCanvas.refresh();
            }
            uiContainer.add(this.add.image(0, 0, 'scanlines_fornalha').setOrigin(0,0).setAlpha(0.6));
        }
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

        const activePlayer = this.jogadorAtual;
        if (!activePlayer || !activePlayer.body || activePlayer.estaRenascendo) return;

        if (this.escuroAtivo && this.escuridaoSprite) {
            this.escuridaoSprite.setPosition(activePlayer.x, activePlayer.y);
        }

        if (this.socket) {
            this.socket.emit('enviarPosicao', {
                x: activePlayer.x,
                y: activePlayer.y,
                cena: this.scene.key
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

        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;

        const isBtnPressed = (padObj, index) => {
            if (!padObj || !padObj.buttons || !padObj.buttons[index]) return false;
            return padObj.buttons[index].pressed || padObj.buttons[index].value > 0.5;
        };

        if (pad) {
            const axisX = pad.leftStick ? pad.leftStick.x : 0;
            if (axisX < -0.2 || pad.left || isBtnPressed(pad, 14)) indoEsquerda = true;
            if (axisX > 0.2 || pad.right || isBtnPressed(pad, 15)) indoDireita = true;

            if (isBtnPressed(pad, 2) || isBtnPressed(pad, 0) || pad.A) tentouPular = true;
            if (isBtnPressed(pad, 6) || isBtnPressed(pad, 3) || isBtnPressed(pad, 7) || (pad.R2 && pad.R2 > 0.1)) estaCorrendo = true;

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

        this.containerVitoria = this.add.container(0, 0).setDepth(1000); 
        this.containerVitoria.setScrollFactor(0); // TRAVANDO O PAINEL DE VITÓRIA NA TELA

        const containerVitoria = this.containerVitoria;

        const corHex = this.personagemInicial === 'solar' ? 0x00f3ff : 0xff8800;
        const corStr = this.personagemInicial === 'solar' ? "#00f3ff" : "#ff8800";

        const fundo = this.add.rectangle(0, 0, width, height, 0x0a0a12, 0.95).setOrigin(0, 0);
        containerVitoria.add(fundo);

        let linhasTV = this.add.graphics();
        linhasTV.fillStyle(0x000000, 0.4);
        for(let i = 0; i < height; i += 4) linhasTV.fillRect(0, i, width, 2);
        containerVitoria.add(linhasTV);

        let moldura = this.add.graphics();
        moldura.lineStyle(2, corHex, 0.6);
        moldura.strokeRect(30, 30, width - 60, height - 60);
        containerVitoria.add(moldura);

        const txtTerminal = this.add.text(45, 45, "HEATCORE_OS // DIARY_SIMULATION_COMPLETE\n> UPLINK ESTABLISHED...\n> WINNER IDENTIFIED:", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: corStr, shadow: { offsetX: 0, offsetY: 0, color: corStr, blur: 4, fill: true }
        });
        containerVitoria.add(txtTerminal);

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
            spriteVencedor = this.add.image(width / 2, height / 2 - 30, 'Personagens', frameKey).setDisplaySize(140, 140);
        } else {
            const chaveSprite = this.personagemInicial === 'solar' ? 'solar_andando' : 'Fornalha';
            spriteVencedor = this.add.sprite(width / 2, height / 2 - 30, chaveSprite, 0).setDisplaySize(140, 140);
        }

        spriteVencedor.setTint(corHex);
        this.tweens.add({
            targets: spriteVencedor,
            alpha: { from: 0.7, to: 1 },
            duration: 150,
            yoyo: true,
            repeat: -1
        });
        
        containerVitoria.add(spriteVencedor);

        const textoVitoria = this.add.text(width / 2, height / 2 + 70, `>> ${nomeVencedor} VENCEU <<`, {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 28,
            color: "#ffffff",
            fontStyle: "bold",
            stroke: corStr,
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: corStr, blur: 8, fill: true }
        }).setOrigin(0.5);
        containerVitoria.add(textoVitoria);

        this.tweens.add({
            targets: textoVitoria,
            scale: { from: 0.95, to: 1.05 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.time.delayedCall(3500, () => {
            this.executarTransicaoSaida();
        });
    }
}
import { Scene } from "phaser";

export class Diario extends Scene {
    constructor() {
        super('Diario');
    }

    init(data) {
        this.offsetDias = data ? (data.offsetDias || 0) : 0;
        this.personagemInicial = data ? (data.personagem || 'solar') : 'solar';
    }

    create() {
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ==========================================
        // 0. CONEXÃO SOCKET.IO & MULTIPLAYER
        // ==========================================
        this.socket = this.game.socket;
        this.outroPersonagemTipo = this.personagemInicial === 'solar' ? 'fornalha' : 'solar';

        console.log(`🎮 [DIARIO] Entrou na cena como: ${this.personagemInicial}. O outro é: ${this.outroPersonagemTipo}`);

        // Escuta se o outro jogador completou a fase para expulsar este também
        if (this.socket) {
            this.socket.off('voltarAoMenuGeral'); 
            this.socket.on('voltarAoMenuGeral', () => {
                console.log(`🏆 [DIARIO] Recebido aviso de conclusão de fase. Voltando ao menu...`);
                this.voltarParaMenu();
            });
        }

        // Semente oficial unificada
        const dataSimulada = new Date();
        dataSimulada.setDate(dataSimulada.getDate() + this.offsetDias);
        let currentSeed = (dataSimulada.getUTCFullYear() * 10000) + ((dataSimulada.getUTCMonth() + 1) * 100) + dataSimulada.getUTCDate() + this.offsetDias;

        const randomDiario = () => {
            let t = currentSeed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };

        // ==========================================
        // 1. CARREGAMENTO DOS TILESETS E ÁUDIO
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

        // ==========================================
        // ⚙️ TEMA DIÁRIO DOS BLOCOS DE AR
        // ==========================================
        const BASE_TEXTURAS1 = 3;
        const ID_BLOCO_BRANCO = BASE_TEXTURAS1 + 17;
        const ID_BLOCO_PRETO  = BASE_TEXTURAS1 + 38;

        const COR_MAPA_HOJE = randomDiario() > 0.5 ? ID_BLOCO_BRANCO : ID_BLOCO_PRETO;

        // ==========================================
        // 1.2 LIMPEZA E RECONSTRUÇÃO PROCEDURAL
        // ==========================================
        const larg = map.width;
        const alt = map.height;

        for (let x = 0; x < larg; x++) {
            for (let y = 0; y < alt; y++) {
                layerLimites.removeTileAt(x, y);
                layerObjetos.removeTileAt(x, y);
                layerPedras?.removeTileAt(x, y);
                
                if (x === 0 || x === larg - 1 || y === 0) {
                    layerLimites.putTileAt(COR_MAPA_HOJE, x, y);
                }
            }
        }

        let ySolar = Math.floor(randomDiario() * (alt - 20)) + 10;
        let yFornalha = Math.floor(randomDiario() * (alt - 20)) + 10;

        // Corredor Solar
        for (let x = 1; x <= 10; x++) {
            layerLimites.putTileAt(COR_MAPA_HOJE, x, ySolar); 
            layerLimites.putTileAt(COR_MAPA_HOJE, x, ySolar - 6); 
        }
        for (let y = ySolar - 5; y < ySolar; y++) layerLimites.putTileAt(COR_MAPA_HOJE, 1, y);

        // Corredor Fornalha
        for (let x = larg - 11; x < larg - 1; x++) {
            layerLimites.putTileAt(COR_MAPA_HOJE, x, yFornalha); 
            layerLimites.putTileAt(COR_MAPA_HOJE, x, yFornalha - 6); 
        }
        for (let y = yFornalha - 5; y < yFornalha; y++) layerLimites.putTileAt(COR_MAPA_HOJE, larg - 2, y);

        // Abismo e Plataformas Flutuantes
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

        layerLimites.setCollisionByExclusion([-1]);
        layerObjetos.setCollisionByExclusion([-1]);
        
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, false);

        // ==========================================
        // 2. SPAWN DO PERSONAGEM LOCAL E REMOTO (SEPARADOS)
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
        this.outroSprite.setVisible(false); // Oculto até receber dados reais da rede

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
        // INTERFACE DA MÁQUINA DO TEMPO (+ / -)
        // ==========================================
        let stringData = dataSimulada.toLocaleDateString();
        let textoOffset = this.offsetDias === 0 ? "HOJE" : (this.offsetDias > 0 ? `+${this.offsetDias} DIA(S)` : `${this.offsetDias} DIA(S)`);

        this.add.text(40, 30, `MAPA DIÁRIO: ${textoOffset} (${stringData})`, {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", stroke: "#000000", strokeThickness: 3
        }).setScrollFactor(0).setDepth(200);
        this.add.text(40, 60, "[ ESC / SELECT: VOLTAR AO MENU ]", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#ff9900", stroke: "#000000", strokeThickness: 3
        }).setScrollFactor(0).setDepth(200);

        if (this.textures.exists('escuridaoComFuroDiario')) this.textures.remove('escuridaoComFuroDiario');
        const canvLarg = 2500, canvAlt = 2500, raioLuz = 24;   
        const canvasTexture = this.textures.createCanvas('escuridaoComFuroDiario', canvLarg, canvAlt);
        const ctx = canvasTexture.context;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvLarg, canvAlt);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(canvLarg / 2, canvAlt / 2, raioLuz, 0, Math.PI * 2);
        ctx.fill();
        canvasTexture.refresh();

        // ==========================================
        // 3. FÍSICAS, ANIMAÇÕES E CONTROLES
        // ==========================================
        this.physics.add.collider(this.jogadorAtual, layerLimites);
        this.physics.add.collider(this.jogadorAtual, layerObjetos);

        const teleporterAlvo = this.personagemInicial === 'solar' ? teleporter2 : teleporter1;
        this.physics.add.overlap(this.jogadorAtual, teleporterAlvo, this.completouMapaDiario, null, this);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.jogadorAtual);

        this.configurarAnimacoes();
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.tecla1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.tecla2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        this.teclaMaisNum = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD);
        this.teclaMenosNum = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT);
        this.teclaMais = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
        this.teclaIgual = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EQUAL); 
        this.teclaMenos = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
        
        this.jaEstaSaindo = false;
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

        if (Phaser.Input.Keyboard.JustDown(this.teclaMaisNum) || Phaser.Input.Keyboard.JustDown(this.teclaMais) || Phaser.Input.Keyboard.JustDown(this.teclaIgual)) {
            this.scene.restart({ offsetDias: this.offsetDias + 1, personagem: this.personagemInicial });
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.teclaMenosNum) || Phaser.Input.Keyboard.JustDown(this.teclaMenos)) {
            this.scene.restart({ offsetDias: this.offsetDias - 1, personagem: this.personagemInicial });
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
            this.voltarParaMenu();
            return;
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
        this.apertouE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.apertouW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.apertouA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.apertouD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.apertouShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        let indoEsquerda = this.cursors.left.isDown || this.apertouA.isDown;
        let indoDireita = this.cursors.right.isDown || this.apertouD.isDown;
        let tentouPular = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.apertouW.isDown;
        let estaCorrendo = this.apertouShift.isDown;

        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        if (pad) {
            const axisX = pad.leftStick.x;
            if (axisX < -0.2) indoEsquerda = true;
            if (axisX > 0.2) indoDireita = true;
            if (pad.A || (pad.buttons.length > 0 && pad.buttons[0].pressed)) tentouPular = true;
            if (pad.R2 > 0.1 || (pad.buttons.length > 7 && pad.buttons[7].value > 0.1)) estaCorrendo = true;
            if (pad.buttons.length > 8 && pad.buttons[8].pressed) {
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

        if (this.escuridaoSprite && activePlayer) this.escuridaoSprite.setPosition(activePlayer.x, activePlayer.y);
        
        if (Phaser.Input.Keyboard.JustDown(this.apertouE)) {
            this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuroDiario').setDepth(100);
        }
    }

    voltarParaMenu() {
        if (this.jaEstaSaindo) return;
        this.jaEstaSaindo = true;
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

    completouMapaDiario(jogador, teleportador) {
        if (this.jaEstaSaindo) return;
        
        // Avisa o servidor que alguém concluiu o mapa diário
        if (this.socket) {
            this.socket.emit('faseDiarioConcluida');
        }
        
        // Sai localmente também
        this.voltarParaMenu(); 
    }
}
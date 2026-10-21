import { Scene } from "phaser";

export class Mapa2 extends Scene {
    constructor() {
        super('Mapa2');
    }

    init(data) {
        this.personagemInicial = this.game.meuPersonagem || (data && data.personagem) || 'solar';
        this.outroPersonagemTipo = this.personagemInicial === 'solar' ? 'fornalha' : 'solar';
        
        this.pontosSolar = data ? (data.pontosSolar || 0) : 0;
        this.pontosFornalha = data ? (data.pontosFornalha || 0) : 0;

        console.log(`🛡️ [MAPA2] Esta aba é rigorosamente o: ${this.personagemInicial.toUpperCase()}`);
    }

    create() {
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ==========================================
        // 0. CONEXÃO SOCKET.IO & MULTIPLAYER
        // ==========================================
        this.socket = this.game.socket;

        if (this.socket) {
            this.socket.off('irParaTransicao');
            this.socket.on('irParaTransicao', (dados) => {
                if (this.jaEstaSaindo) return;
                this.jaEstaSaindo = true;
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.stop();
                    this.scene.start('PlacarTransicao', dados);
                });
            });
        }

        // ==========================================
        // 1. CRIAÇÃO DO MAPA E LIMITES DE QUEDA
        // ==========================================
        const map = this.make.tilemap({ key: 'mapa2' });

        const tsFundo = map.addTilesetImage('FundoMetal', 'FundoMetal');
        const tsPersonagens = map.addTilesetImage('Personagens', 'Personagens');
        const tsTexturas = map.addTilesetImage('texturas_tileset1', 'texturas_tileset1');
        const tsPedras = map.addTilesetImage('TilesPedra', 'TilesPedra');
        const tsEspinhos = map.addTilesetImage('Espinhos', 'Espinhos');

        const arrayTilesets = [tsFundo, tsPersonagens, tsTexturas, tsPedras, tsEspinhos];

        const layerPedras = map.createLayer('Pedras', arrayTilesets, 0, 0);
        const layerCenarioDeFundo = map.createLayer('CenarioDeFundo', arrayTilesets, 0, 0);
        const layerLimites = map.createLayer('Limites', arrayTilesets, 0, 0);
        const layerObjetos = map.createLayer('Objetos', arrayTilesets, 0, 0);
        const layerForeground = map.createLayer('Foreground', arrayTilesets, 0, 0);

        if (this.cache.audio.has('som_queda')) {
            this.somQueda = this.sound.add('som_queda');
        }

        this.mapaAlturaTotal = map.heightInPixels;

        layerLimites.setCollisionByExclusion([-1]);
        layerObjetos.setCollisionByExclusion([-1]);
        
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, false);

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

        // ==========================================
        // 2. SPAWN DO PERSONAGEM LOCAL E REMOTO
        // ==========================================
        const posicoesSpawn = {
            solar: { x: 247.5, y: 370 },
            fornalha: { x: 1100, y: 370 }
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

        // ==========================================
        // 2.1 TELEPORTADORES
        // ==========================================
        this.teleporters = this.physics.add.staticGroup();

        const teleporter1 = this.teleporters.create(210, 370, 'corredorEsquerdo').setVisible(false);
        const teleporter2 = this.teleporters.create(1150, 370, 'corredorDireito').setVisible(false);

        // ==========================================
        // 3. COLISÕES E CÂMERA
        // ==========================================
        this.physics.add.collider(this.jogadorAtual, layerLimites);
        this.physics.add.collider(this.jogadorAtual, layerObjetos);

        const teleporterAlvo = this.personagemInicial === 'solar' ? teleporter2 : teleporter1;
        this.physics.add.overlap(this.jogadorAtual, teleporterAlvo, this.completouFase, null, this);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.jogadorAtual);

        // ==========================================
        // 4. ANIMAÇÕES
        // ==========================================
        if (!this.anims.exists('walk')) {
            this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('solar_andando', { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists('run')) {
            this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('solar_correndo', { start: 1, end: 2 }), frameRate: 15 });
        }
        if (!this.anims.exists('jump')) {
            this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('solar_pulando', { start: 2, end: 2 }), frameRate: 100 });
        }
        if (!this.anims.exists('fall')) {
            this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('solar_caindo', { start: 2, end: 2 }), frameRate: 10 });
        }
        if (!this.anims.exists('wallSlide')) {
            this.anims.create({ key: 'wallSlide', frames: this.anims.generateFrameNumbers('solar_deslizando', { start: 1, end: 1 }), frameRate: 10 });
        }

        // ==========================================
        // 5. CONTROLES
        // ==========================================
        this.cursors = this.input.keyboard.createCursorKeys();
        this.jaEstaSaindo = false;
    }

    update() {
        if (this.jaEstaSaindo) return;

        const limiteQueda = this.mapaAlturaTotal + 20;
        
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

            // CANCELAR / VOLTAR: Botão A (Vermelho / direita - index 1) ou SELECT (index 8)
            if (isBtnPressed(pad, 1) || isBtnPressed(pad, 8)) {
                if (this.scene.isActive('Mapa2')) {
                    this.scene.stop('Mapa2');
                    this.scene.start('MainMenu');
                }
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
            this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuro').setDepth(100);
        }
    }

    completouFase(jogador, teleportador) {
        if (this.jaEstaSaindo) return;

        const quemMarcouPonto = this.personagemInicial; 

        const dadosTransicao = {
            proximaCena: 'Mapa3',
            personagem: this.personagemInicial,
            pontosSolar: this.pontosSolar,
            pontosFornalha: this.pontosFornalha,
            quemMarcou: quemMarcouPonto
        };

        if (this.socket) {
            this.socket.emit('faseConcluida', dadosTransicao);
        }

        this.jaEstaSaindo = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.stop();
            this.scene.start('PlacarTransicao', dadosTransicao);
        });
    }

    irParaProximaFaseDireto() {
        if (this.jaEstaSaindo) return;
        this.jaEstaSaindo = true;

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (this.scene.isActive('Mapa2')) {
                this.scene.stop('Mapa2');
                this.scene.start('Mapa3', { personagem: this.personagemInicial });
            }
        });
    }
}
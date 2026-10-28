import { Scene } from "phaser";

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.personagemInicial = (data && data.personagem) ? data.personagem : (this.game.meuPersonagem || 'solar');
        this.outroPersonagemTipo = this.personagemInicial === 'solar' ? 'fornalha' : 'solar';
        
        this.pontosSolar = data ? (data.pontosSolar || 0) : 0;
        this.pontosFornalha = data ? (data.pontosFornalha || 0) : 0;

        console.log(`🛡️ [SEGURANÇA] Esta aba é rigorosamente o: ${this.personagemInicial.toUpperCase()}`);
    }

    create() {
        // Puxa o volume global apenas uma vez no topo do create
        const volSFX = this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7;

        // =============== SISTEMA DE AMBIENTAÇÃO ===============
        let somAmbiente = this.sound.get('ambientacao');
        
        if (!somAmbiente) {
            somAmbiente = this.sound.add('ambientacao', { loop: true, volume: 0.8 }); 
        }
        
        if (!somAmbiente.isPlaying) {
            somAmbiente.play();
        }
        // ======================================================

        this.cameras.main.fadeIn(600, 0, 0, 0);

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

        const map = this.make.tilemap({ key: 'mapa' });

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

        layerLimites.setCollisionByExclusion([-1]);
        layerObjetos.setCollisionByExclusion([-1]);
        
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

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

        this.escuroAtivo = false;
        this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuro').setDepth(150).setVisible(false);

        const posicoesSpawn = {
            solar: { x: 247.5, y: 520 },
            fornalha: { x: 680, y: 300 }
        };

        const coordLocal = posicoesSpawn[this.personagemInicial];
        const chaveLocal = this.personagemInicial === 'solar' ? 'solar_andando' : 'fornalha_andando';

        this.jogadorAtual = this.physics.add.sprite(coordLocal.x, coordLocal.y, chaveLocal);
        this.jogadorAtual.setCircle(8).setCollideWorldBounds(true);
        this.jogadorAtual.spawnX = this.jogadorAtual.x;
        this.jogadorAtual.spawnY = this.jogadorAtual.y;
        this.jogadorAtual.estaRenascendo = false;

        const coordOutro = posicoesSpawn[this.outroPersonagemTipo];
        const chaveSpriteOutro = this.outroPersonagemTipo === 'solar' ? 'solar_andando' : 'fornalha_andando';

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

        this.teleporters = this.physics.add.staticGroup();
        const teleporter1 = this.teleporters.create(210, 510, 'corredorEsquerdo').setVisible(false);
        const teleporter2 = this.teleporters.create(720, 290, 'corredorDireito').setVisible(false);

        this.physics.add.collider(this.jogadorAtual, layerLimites);
        this.physics.add.collider(this.jogadorAtual, layerObjetos);

        const teleporterAlvo = this.personagemInicial === 'solar' ? teleporter2 : teleporter1;
        this.physics.add.overlap(this.jogadorAtual, teleporterAlvo, this.completouFase, null, this);

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
                if (this.escuridaoSprite) this.escuridaoSprite.setVisible(this.escuroAtivo);
            }
        });

        this.uiContainer = this.add.container(0, 0).setDepth(190);
        this.uiContainer.setScrollFactor(0);
        this.adicionarFiltroVisao();

        // Configuração dos áudios de movimento com volume do menu de opções
        this.somAndando = this.sound.add('sfx_andando', { loop: true, volume: 0.25 * volSFX });
        this.somCorrendo = this.sound.add(this.personagemInicial === 'solar' ? 'sfx_correndo_solar' : 'sfx_correndo_fornalha', { loop: true, volume: 0.25 * volSFX });
        this.somPulando = this.sound.add('sfx_pulando', { volume: 0.4 * volSFX });
    }

    pararSonsMovimento() {
        if (this.somAndando) {
            this.somAndando.stop();
            this.somAndando.destroy();
        }
        if (this.somCorrendo) {
            this.somCorrendo.stop();
            this.somCorrendo.destroy();
        }
    }

    configurarAnimacoes() {
        const char = this.personagemInicial; // 'solar' ou 'fornalha'
        
        if (!this.anims.exists(`${char}_walk`)) {
            this.anims.create({ key: `${char}_walk`, frames: this.anims.generateFrameNumbers(`${char}_andando`, { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists(`${char}_run`)) {
            this.anims.create({ key: `${char}_run`, frames: this.anims.generateFrameNumbers(`${char}_correndo`, { start: 1, end: 2 }), frameRate: 15 });
        }
        if (!this.anims.exists(`${char}_jump`)) {
            this.anims.create({ key: `${char}_jump`, frames: this.anims.generateFrameNumbers(`${char}_pulando`, { start: 2, end: 2 }), frameRate: 100 });
        }
        if (!this.anims.exists(`${char}_fall`)) {
            this.anims.create({ key: `${char}_fall`, frames: this.anims.generateFrameNumbers(`${char}_caindo`, { start: 2, end: 2 }), frameRate: 10 });
        }
        if (!this.anims.exists(`${char}_wallSlide`)) {
            this.anims.create({ key: `${char}_wallSlide`, frames: this.anims.generateFrameNumbers(`${char}_deslizando`, { start: 1, end: 1 }), frameRate: 10 });
        }
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

    update() {
        if (this.jaEstaSaindo) return;
        
        // Puxa o volume global apenas uma vez no topo do update
        const volSFX = this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7;

        const activePlayer = this.jogadorAtual;
        if (!activePlayer || !activePlayer.body) return;

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

        // ==========================================
        // MAPEAMENTO HÍBRIDO NATIVO (Xbox + PlayStation + SNES)
        // ==========================================
        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        
        const isBtnPressed = (padObj, index) => {
            if (padObj && padObj.buttons && padObj.buttons[index]) {
                if (padObj.buttons[index].pressed || padObj.buttons[index].value > 0.5) return true;
            }
            if (typeof navigator !== 'undefined' && navigator.getGamepads) {
                const rawPads = navigator.getGamepads();
                for (let i = 0; i < rawPads.length; i++) {
                    const rp = rawPads[i];
                    if (rp && rp.buttons && rp.buttons[index] && (rp.buttons[index].pressed || rp.buttons[index].value > 0.5)) return true;
                }
            }
            return false;
        };

        const getAxisValue = (padObj, axisIndex) => {
            if (padObj && padObj.axes && padObj.axes.length > axisIndex) {
                let v = padObj.axes[axisIndex];
                return (typeof v === 'number') ? v : (v ? v.getValue() : 0);
            }
            if (typeof navigator !== 'undefined' && navigator.getGamepads) {
                const rawPads = navigator.getGamepads();
                for (let i = 0; i < rawPads.length; i++) {
                    const rp = rawPads[i];
                    if (rp && rp.axes && rp.axes.length > axisIndex) {
                        return rp.axes[axisIndex];
                    }
                }
            }
            return 0;
        };

        let indoEsquerda = this.cursors.left.isDown || this.apertouA.isDown;
        let indoDireita = this.cursors.right.isDown || this.apertouD.isDown;
        let tentouPular = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.apertouW.isDown;
        let estaCorrendo = this.apertouShift.isDown;

        const padAtivo = pad || (typeof navigator !== 'undefined' && navigator.getGamepads && navigator.getGamepads().filter(p => p).length > 0);

        if (padAtivo) {
            const axisX = (pad && pad.leftStick ? pad.leftStick.x : 0) || getAxisValue(pad, 0);
            
            if (axisX < -0.2 || (pad && pad.left) || isBtnPressed(pad, 14)) indoEsquerda = true;
            if (axisX > 0.2 || (pad && pad.right) || isBtnPressed(pad, 15)) indoDireita = true;

            // B0 (A), B1 (B) = Pular | B2 (X), B3 (Y), L, R = Correr
            if (isBtnPressed(pad, 2) || (pad && pad.A)) tentouPular = true;
            if (isBtnPressed(pad, 3) || isBtnPressed(pad, 6) || (pad && pad.R2 && pad.R2 > 0.1)) estaCorrendo = true;

            // B8 (Select), B9 (Start) = Sair
            if (isBtnPressed(pad, 8) || isBtnPressed(pad, 9)) {
                if (this.scene.isActive('Game')) { 
                    this.scene.stop('Game');
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

        if (tentouPular && noChao) {
            activePlayer.setVelocityY(-400); 
            if (this.somPulando) this.somPulando.play({ volume: 0.4 * volSFX });
        }
        if (estaNaParede) activePlayer.setVelocityY(50); 

        if (tentouPular && estaNaParede) {
            executouWallJump = true;
            if (indoDireita) { activePlayer.setVelocityX(impulsoParedeX); activePlayer.setVelocityY(-380); }
            else if (indoEsquerda) { activePlayer.setVelocityX(-impulsoParedeX); activePlayer.setVelocityY(-380); }
            if (this.somPulando) this.somPulando.play({ volume: 0.4 * volSFX });
        }

        if (!executouWallJump) {
            if (indoEsquerda) { activePlayer.setVelocityX(-velocidadeX); activePlayer.setFlipX(true); } 
            else if (indoDireita) { activePlayer.setVelocityX(velocidadeX); activePlayer.setFlipX(false); } 
            else { activePlayer.setVelocityX(0); }
        }

        const char = this.personagemInicial; 

        // Função rápida para calar os passos se estiver no ar ou parado
        const silenciarPassos = () => {
            if (this.somAndando && this.somAndando.isPlaying) this.somAndando.stop();
            if (this.somCorrendo && this.somCorrendo.isPlaying) this.somCorrendo.stop();
        };

        if (isTouchingWall && !noChao && isFalling) {
            activePlayer.anims.play(`${char}_wallSlide`, true);
            silenciarPassos();
        } else if (!noChao && Math.abs(body.velocity.y) > 15) {
            if (body.velocity.y < 0) activePlayer.anims.play(`${char}_jump`, true);
            else activePlayer.anims.play(`${char}_fall`, true);
            silenciarPassos();
        } else if (body.velocity.x !== 0) {
            if (estaCorrendo) {
                activePlayer.anims.play(`${char}_run`, true);
                if (this.somAndando.isPlaying) this.somAndando.stop();
                if (!this.somCorrendo.isPlaying) this.somCorrendo.play();
            } else {
                activePlayer.anims.play(`${char}_walk`, true);
                if (this.somCorrendo.isPlaying) this.somCorrendo.stop();
                if (!this.somAndando.isPlaying) this.somAndando.play();
            }
        } else {
            activePlayer.anims.stop();
            activePlayer.setTexture(`${char}_andando`, 0); 
            silenciarPassos();
        }
    }

    completouFase(jogador, teleportador) {
        if (this.jaEstaSaindo) return;
        this.pararSonsMovimento();
        const quemMarcouPonto = this.personagemInicial; 

        const dadosTransicao = {
            proximaCena: 'Mapa2',
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
            if (this.scene.isActive('Game')) {
                this.scene.stop('Game');
                this.scene.start('Mapa2', { personagem: this.personagemInicial });
            }
        });
    }
}
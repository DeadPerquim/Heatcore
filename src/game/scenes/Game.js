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
        this.mostrarTutorialInicial = data ? (data.mostrarTutorial || false) : false;
    }

    create() {
        const volSFX = this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7;

        let somAmbiente = this.sound.get('ambientacao');
        if (!somAmbiente) {
            somAmbiente = this.sound.add('ambientacao', { loop: true, volume: 0.8 }); 
        }
        if (!somAmbiente.isPlaying) somAmbiente.play();

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
        this.jogadorAtual.stunned = false;

        const coordOutro = posicoesSpawn[this.outroPersonagemTipo];
        const chaveSpriteOutro = this.outroPersonagemTipo === 'solar' ? 'solar_andando' : 'fornalha_andando';

        this.outroSprite = this.add.sprite(coordOutro.x, coordOutro.y, chaveSpriteOutro).setAlpha(0.9).setDepth(50);
        this.outroSprite.setVisible(false);

        if (this.socket) {
            this.socket.off('atualizarPosicoes');
            this.socket.on('atualizarPosicoes', (posicoes) => {
                if (!posicoes) return;
                const dadosOutro = posicoes[this.outroPersonagemTipo];
                
                if (dadosOutro) {
                    if (this.outroSprite) {
                        if ((dadosOutro.x === 0 && dadosOutro.y === 0) || (dadosOutro.cena && dadosOutro.cena !== this.scene.key)) {
                            this.outroSprite.setVisible(false);
                        } else {
                            this.outroSprite.x = dadosOutro.x;
                            this.outroSprite.y = dadosOutro.y;
                            this.outroSprite.setVisible(true);

                            // ====== LÓGICA DE RECEBER CHUTE ======
                            if (dadosOutro.pronto === 'chutou' && !this.levouChute && this.jogadorAtual && !this.jogadorAtual.estaRenascendo) {
                                const dist = Phaser.Math.Distance.Between(this.jogadorAtual.x, this.jogadorAtual.y, this.outroSprite.x, this.outroSprite.y);
                                if (dist < 70 && Math.abs(this.jogadorAtual.y - this.outroSprite.y) < 50) {
                                    this.levouChute = true;
                                    this.jogadorAtual.stunned = true;
                                    const direcao = this.jogadorAtual.x < this.outroSprite.x ? -1 : 1;
                                    this.jogadorAtual.setVelocity(direcao * 350, -250);
                                    
                                    setTimeout(() => { if (this.jogadorAtual) this.jogadorAtual.stunned = false; }, 300);
                                    setTimeout(() => { this.levouChute = false; }, 800);
                                }
                            }

                            if (this.timeoutOutroJogador) clearTimeout(this.timeoutOutroJogador);
                            this.timeoutOutroJogador = setTimeout(() => {
                                if (this.outroSprite) this.outroSprite.setVisible(false);
                            }, 2500);
                        }
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
        this.isKicking = false;
        this.levouChute = false;
        this.ultimoEstadoBater = false;

        this.input.keyboard.on('keydown', (event) => {
            if (this.jaEstaSaindo) return;
            // Mudança para 'Q' na lanterna para liberar o 'E' para bater
            if (event.key === 'q' || event.key === 'Q') {
                this.escuroAtivo = !this.escuroAtivo;
                if (this.escuridaoSprite) this.escuridaoSprite.setVisible(this.escuroAtivo);
            }
        });

        this.uiContainer = this.add.container(0, 0).setDepth(190);
        this.uiContainer.setScrollFactor(0);
        this.adicionarFiltroVisao();

        this.somAndando = this.sound.add('sfx_andando', { loop: true, volume: 0.25 * volSFX });
        const rateCorrendo = this.personagemInicial === 'solar' ? 1.8 : 1.4;
        this.somCorrendo = this.sound.add('sfx_andando', { loop: true, volume: 0.25 * volSFX, rate: rateCorrendo });
        this.somPulando = this.sound.add('sfx_pulando', { volume: 0.4 * volSFX });

        if (this.mostrarTutorialInicial) {
            this.criarOverlayControles();
        }
    }

criarOverlayControles() {
        const sw = this.scale.width;
        const sh = this.scale.height;

        this.jogadoresProntos = false; 

        this.overlayControles = this.add.container(0, 0).setDepth(3000);
        this.overlayControles.setScrollFactor(0);

        const fundo = this.add.rectangle(0, 0, sw, sh, 0x06070b, 0.92).setOrigin(0);
        this.overlayControles.add(fundo);

        const graficosFixos = this.add.graphics();
        this.overlayControles.add(graficosFixos);

        graficosFixos.lineStyle(2, 0x00f3ff, 0.2);
        graficosFixos.strokeRect(20, 20, sw - 40, sh - 40);

        graficosFixos.lineStyle(3, 0xff9900, 0.8);
        const l = 20;
        graficosFixos.moveTo(20, 20 + l); graficosFixos.lineTo(20, 20); graficosFixos.lineTo(20 + l, 20);
        graficosFixos.moveTo(sw - 20 - l, 20); graficosFixos.lineTo(sw - 20, 20); graficosFixos.lineTo(sw - 20, 20 + l);
        graficosFixos.moveTo(20, sh - 20 - l); graficosFixos.lineTo(20, sh - 20); graficosFixos.lineTo(20 + l, sh - 20);
        graficosFixos.moveTo(sw - 20 - l, sh - 20); graficosFixos.lineTo(sw - 20, sh - 20); graficosFixos.lineTo(sw - 20, sh - 20 - l);

        this.overlayControles.add(this.add.text(40, 40, "SYS_STATUS // ESPERANDO INPUT...", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#00f3ff"
        }).setAlpha(0.6));

        this.containerBotoes = this.add.container(0, 0);
        this.overlayControles.add(this.containerBotoes);

        const graficosBotoes = this.add.graphics();
        this.containerBotoes.add(graficosBotoes);

        const txtTitulo = this.add.text(sw / 2, sh * 0.12, ">> REVISÃO DE COMANDOS <<", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 24, color: "#ff9900",
            align: 'center', stroke: "#000", strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#ff9900', blur: 8, fill: true }
        }).setOrigin(0.5);
        this.containerBotoes.add(txtTitulo);
        this.tweens.add({ targets: txtTitulo, alpha: { from: 0.7, to: 1 }, duration: 800, yoyo: true, repeat: -1 });

        graficosBotoes.lineStyle(1, 0x00f3ff, 0.3);
        graficosBotoes.lineBetween(sw/2, sh*0.25, sw/2, sh*0.80);

        // ===================================
        // DESENHO DO TECLADO
        // ===================================
        const kx = sw * 0.25;
        const ky = sh * 0.50;

        this.containerBotoes.add(this.add.text(kx, ky - 110, "[ INPUT: TECLADO ]", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 20, color: "#ffffff", fontStyle: "bold" 
        }).setOrigin(0.5));

        const drawKey = (x, y, w, h, label, desc, isHighlight) => {
            const cor = isHighlight ? 0xff9900 : 0x00f3ff;
            const bgCor = isHighlight ? 0x331a00 : 0x001a33;
            graficosBotoes.fillStyle(bgCor, 0.6);
            graficosBotoes.fillRect(x, y, w, h);
            graficosBotoes.lineStyle(2, cor, 0.8);
            graficosBotoes.strokeRect(x, y, w, h);
            
            this.containerBotoes.add(this.add.text(x + w/2, y + h/2, label, { 
                fontFamily: "'Courier New', Courier, monospace", fontSize: 18, color: isHighlight ? "#ff9900" : "#00f3ff", fontStyle: "bold" 
            }).setOrigin(0.5));
            if (desc) {
                this.containerBotoes.add(this.add.text(x + w/2, y + h + 15, desc, { 
                    fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#aaaaaa" 
                }).setOrigin(0.5));
            }
        };

        drawKey(kx - 25, ky - 40, 50, 50, "W", "PULAR", true);
        drawKey(kx - 80, ky + 20, 50, 50, "A", "ESQ.", false);
        drawKey(kx - 25, ky + 20, 50, 50, "S", "", false);
        drawKey(kx + 30, ky + 20, 50, 50, "D", "DIR.", false);
        drawKey(kx - 160, ky + 20, 70, 50, "SHIFT", "CORRER", false);
        drawKey(kx - 80, ky + 100, 160, 40, "ESPAÇO", "PULAR", true);
        
        drawKey(kx + 30, ky - 40, 50, 50, "E", "BATER", true); 
        drawKey(kx - 160, ky + 100, 70, 40, "CTRL", "BATER", true); 

        // ===================================
        // DESENHO DO GAMEPAD
        // ===================================
        const cx = sw * 0.75;
        const cy = sh * 0.50;

        this.containerBotoes.add(this.add.text(cx, cy - 110, "[ INPUT: GAMEPAD ]", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 20, color: "#ffffff", fontStyle: "bold" 
        }).setOrigin(0.5));

        // Botões L e R (Movidos mais para cima para não esmagar o botão X)
        const bumperY = cy - 80;

        graficosBotoes.lineStyle(2, 0x00f3ff, 0.8);
        graficosBotoes.fillStyle(0x001a33, 0.8);
        graficosBotoes.fillRoundedRect(cx - 100, bumperY, 50, 18, 5); // L
        graficosBotoes.strokeRoundedRect(cx - 100, bumperY, 50, 18, 5);
        this.containerBotoes.add(this.add.text(cx - 75, bumperY + 9, "L", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#00f3ff", fontStyle: "bold" 
        }).setOrigin(0.5));

        graficosBotoes.lineStyle(2, 0xff9900, 0.8);
        graficosBotoes.fillStyle(0x331a00, 0.8);
        graficosBotoes.fillRoundedRect(cx + 50, bumperY, 50, 18, 5); // R
        graficosBotoes.strokeRoundedRect(cx + 50, bumperY, 50, 18, 5);
        this.containerBotoes.add(this.add.text(cx + 75, bumperY + 9, "R", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#ff9900", fontStyle: "bold" 
        }).setOrigin(0.5));
        
        // TEXTO "CORRER" perfeitamente posicionado acima do botão R
        this.containerBotoes.add(this.add.text(cx + 75, bumperY - 12, "CORRER", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#aaaaaa" 
        }).setOrigin(0.5));

        // Base do Gamepad
        graficosBotoes.lineStyle(2, 0x00f3ff, 0.5);
        graficosBotoes.fillStyle(0x001a33, 0.3);
        graficosBotoes.fillRoundedRect(cx - 130, cy - 40, 260, 110, 35);
        graficosBotoes.strokeRoundedRect(cx - 130, cy - 40, 260, 110, 35);

        graficosBotoes.fillStyle(0x00f3ff, 0.15);
        graficosBotoes.lineStyle(2, 0x00f3ff, 0.8);
        const dX = cx - 70;
        const dY = cy + 15;
        
        graficosBotoes.beginPath();
        graficosBotoes.moveTo(dX - 8, dY - 25); graficosBotoes.lineTo(dX + 8, dY - 25);
        graficosBotoes.lineTo(dX + 8, dY - 8); graficosBotoes.lineTo(dX + 25, dY - 8);
        graficosBotoes.lineTo(dX + 25, dY + 8); graficosBotoes.lineTo(dX + 8, dY + 8);
        graficosBotoes.lineTo(dX + 8, dY + 25); graficosBotoes.lineTo(dX - 8, dY + 25);
        graficosBotoes.lineTo(dX - 8, dY + 8); graficosBotoes.lineTo(dX - 25, dY + 8);
        graficosBotoes.lineTo(dX - 25, dY - 8); graficosBotoes.lineTo(dX - 8, dY - 8);
        graficosBotoes.closePath(); graficosBotoes.fillPath(); graficosBotoes.strokePath();

        this.containerBotoes.add(this.add.text(dX, dY + 45, "MOVER", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#aaaaaa" 
        }).setOrigin(0.5));

        // Função de desenho atualizada para permitir o controle do deslocamento no eixo X e Y (evita overlap)
        const drawBtn = (bx, by, label, isHighlight, desc, descOffX, descOffY) => {
            const cor = isHighlight ? 0xff9900 : 0x00f3ff;
            graficosBotoes.lineStyle(2, cor, 0.8);
            graficosBotoes.fillStyle(isHighlight ? 0x331a00 : 0x001a33, 0.8);
            graficosBotoes.fillCircle(bx, by, 14);
            graficosBotoes.strokeCircle(bx, by, 14);
            this.containerBotoes.add(this.add.text(bx, by, label, { 
                fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: isHighlight ? "#ff9900" : "#00f3ff", fontStyle: "bold" 
            }).setOrigin(0.5));
            if (desc) {
                this.containerBotoes.add(this.add.text(bx + descOffX, by + descOffY, desc, { 
                    fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#aaaaaa" 
                }).setOrigin(0.5));
            }
        };

        const bX = cx + 70;
        const bY = cy + 15;
        
        // BATER colocado ao lado direito (40px) e CORRER ao lado esquerdo (-45px), liberando espaço superior!
        drawBtn(bX, bY - 28, "X", true, "BATER", 40, 0); 
        drawBtn(bX - 28, bY, "Y", true, "CORRER", -45, 0); 
        drawBtn(bX, bY + 28, "B", true, "PULAR", 0, 25);  
        drawBtn(bX + 28, bY, "A", false, "", 0, 0);  

        graficosBotoes.lineStyle(2, 0x00f3ff, 0.5);
        graficosBotoes.strokeRect(cx - 25, cy + 25, 18, 6);
        graficosBotoes.strokeRect(cx + 7, cy + 25, 18, 6);

        const txtSkip = this.add.text(sw/2, sh - 45, "[ PRESSIONE QUALQUER BOTÃO PARA INICIAR A SIMULAÇÃO ]", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#00ff66"
        }).setOrigin(0.5);
        this.containerBotoes.add(txtSkip);
        this.tweens.add({ targets: txtSkip, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

        this._tecladoListener = () => this.confirmarControles();
        this._mouseListener = () => this.confirmarControles();

        this.input.keyboard.once('keydown', this._tecladoListener);
        this.input.once('pointerdown', this._mouseListener);
        
        this.podeFecharComGamepad = true; 
    }

    confirmarControles() {
        if (!this.jogadoresProntos) {
            if (this._tecladoListener) this.input.keyboard.off('keydown', this._tecladoListener);
            if (this._mouseListener) this.input.off('pointerdown', this._mouseListener);

            let vol = this.game.volumeSFX !== undefined ? this.game.volumeSFX * 0.5 : 0.3;
            if (this.cache.audio.exists('sfx_clicar_botao')) {
                this.sound.play('sfx_clicar_botao', {volume: vol});
            } else if (this.cache.audio.exists('click')) {
                this.sound.play('click', {volume: vol});
            }
            this.containerBotoes.setVisible(false);
            this.iniciarPartida();
        }
    }

    iniciarPartida() {
        if (this.jogadoresProntos) return;
        this.jogadoresProntos = true;
        this.tweens.add({
            targets: this.overlayControles, alpha: 0, duration: 300,
            onComplete: () => { this.overlayControles.setVisible(false); }
        });
    }

    pararSonsMovimento() {
        if (this.somAndando) { this.somAndando.stop(); this.somAndando.destroy(); }
        if (this.somCorrendo) { this.somCorrendo.stop(); this.somCorrendo.destroy(); }
    }

    configurarAnimacoes() {
        const char = this.personagemInicial;
        if (!this.anims.exists(`${char}_walk`)) this.anims.create({ key: `${char}_walk`, frames: this.anims.generateFrameNumbers(`${char}_andando`, { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
        if (!this.anims.exists(`${char}_run`)) this.anims.create({ key: `${char}_run`, frames: this.anims.generateFrameNumbers(`${char}_correndo`, { start: 1, end: 2 }), frameRate: 15 });
        if (!this.anims.exists(`${char}_jump`)) this.anims.create({ key: `${char}_jump`, frames: this.anims.generateFrameNumbers(`${char}_pulando`, { start: 2, end: 2 }), frameRate: 100 });
        if (!this.anims.exists(`${char}_fall`)) this.anims.create({ key: `${char}_fall`, frames: this.anims.generateFrameNumbers(`${char}_caindo`, { start: 2, end: 2 }), frameRate: 10 });
        if (!this.anims.exists(`${char}_wallSlide`)) this.anims.create({ key: `${char}_wallSlide`, frames: this.anims.generateFrameNumbers(`${char}_deslizando`, { start: 1, end: 1 }), frameRate: 10 });
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
            drawScrap(0, 0, 1, 1); drawScrap(sw, 0, -1, 1);
            drawScrap(0, sh, 1, -1); drawScrap(sw, sh, -1, -1);
            uiContainer.add(g);

            if (!this.textures.exists('scanlines_fornalha')) {
                const scanCanvas = this.textures.createCanvas('scanlines_fornalha', sw, sh);
                const ctx = scanCanvas.context;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                for (let y = 0; y < sh; y += 6) ctx.fillRect(0, y, sw, 2);
                scanCanvas.refresh();
            }
            uiContainer.add(this.add.image(0, 0, 'scanlines_fornalha').setOrigin(0,0).setAlpha(0.6));
        }
    }

    update() {
        if (this.jaEstaSaindo) return;

        if (!this.jogadoresProntos && this.mostrarTutorialInicial) {
            const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
            const padAtivo = pad || (typeof navigator !== 'undefined' && navigator.getGamepads && navigator.getGamepads().filter(p => p).length > 0);
            
            if (padAtivo && this.podeFecharComGamepad) {
                let apertouGamepad = false;
                if (pad && pad.buttons) {
                    for (let i = 0; i < pad.buttons.length; i++) {
                        if (pad.buttons[i].pressed || pad.buttons[i].value > 0.5) apertouGamepad = true;
                    }
                }
                if (typeof navigator !== 'undefined' && navigator.getGamepads) {
                    const rawPads = navigator.getGamepads();
                    for (let p = 0; p < rawPads.length; p++) {
                        if (rawPads[p] && rawPads[p].buttons) {
                            for (let b = 0; b < rawPads[p].buttons.length; b++) {
                                if (rawPads[p].buttons[b].pressed || rawPads[p].buttons[b].value > 0.5) apertouGamepad = true;
                            }
                        }
                    }
                }

                if (apertouGamepad) {
                    this.confirmarControles();
                    this.podeFecharComGamepad = false;
                }
            }
        }
        
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
                cena: this.scene.key,
                pronto: this.isKicking ? 'chutou' : false
            });
        }

        const body = activePlayer.body;
        this.apertouW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.apertouA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.apertouD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.apertouShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.apertouE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.apertouCtrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);

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
        
        // --- SISTEMA DE CHUTE ---
        let apertouBaterAgora = false;
        if (this.apertouE.isDown || this.apertouCtrl.isDown) apertouBaterAgora = true;

        const padAtivo = pad || (typeof navigator !== 'undefined' && navigator.getGamepads && navigator.getGamepads().filter(p => p).length > 0);

        if (padAtivo) {
            const axisX = (pad && pad.leftStick ? pad.leftStick.x : 0) || getAxisValue(pad, 0);
            if (axisX < -0.2 || (pad && pad.left) || isBtnPressed(pad, 14)) indoEsquerda = true;
            if (axisX > 0.2 || (pad && pad.right) || isBtnPressed(pad, 15)) indoDireita = true;

            if (isBtnPressed(pad, 2) || (pad && pad.A)) tentouPular = true;
            if (isBtnPressed(pad, 3) || isBtnPressed(pad, 5) || (pad && pad.R2 && pad.R2 > 0.1)) estaCorrendo = true;

            // Identificando o Botão de Topo (X no SNES) para o chute/soco
            if (isBtnPressed(pad, 0)) apertouBater = true;

            if (isBtnPressed(pad, 8) || isBtnPressed(pad, 9)) {
                if (this.scene.isActive('Game')) { 
                    this.scene.stop('Game');
                    this.pararSonsMovimento();
                    this.scene.start('MainMenu');
                }
                return;
            }
        }

        if (apertouBaterAgora && !this.ultimoEstadoBater && !this.isKicking) {
            this.isKicking = true;
            setTimeout(() => this.isKicking = false, 400); 
        }
        this.ultimoEstadoBater = apertouBaterAgora;

        if (!this.jogadoresProntos) {
            indoEsquerda = false; indoDireita = false; tentouPular = false; estaCorrendo = false;
            if (padAtivo && this.podeFecharComGamepad) {
                let apertouGamepad = false;
                if (pad && pad.buttons) {
                    for (let i = 0; i < pad.buttons.length; i++) {
                        if (isBtnPressed(pad, i)) apertouGamepad = true;
                    }
                }
                if (typeof navigator !== 'undefined' && navigator.getGamepads) {
                    const rawPads = navigator.getGamepads();
                    for (let p = 0; p < rawPads.length; p++) {
                        if (rawPads[p] && rawPads[p].buttons) {
                            for (let b = 0; b < rawPads[p].buttons.length; b++) {
                                if (rawPads[p].buttons[b].pressed || rawPads[p].buttons[b].value > 0.5) apertouGamepad = true;
                            }
                        }
                    }
                }
                if (apertouGamepad) {
                    this.confirmarControles();
                    this.podeFecharComGamepad = false;
                }
            }
        }

        const noChao = body.blocked.down || body.touching.down || body.onFloor();
        const isTouchingWall = body.blocked.left || body.blocked.right;
        const isFalling = body.velocity.y > 0;
        const estaNaParede = isTouchingWall && !noChao && isFalling;

        const velocidadeMax = estaCorrendo ? 260 : 160; 
        const impulsoParedeX = estaCorrendo ? 320 : 220; 
        
        // Se levou o chute (stunned), anulamos o controle do player para simular o baque
        if (this.jogadorAtual.stunned) {
            indoEsquerda = false;
            indoDireita = false;
            tentouPular = false;
        }

        if (tentouPular && noChao) {
            activePlayer.setVelocityY(-400); 
            if (this.somPulando) this.somPulando.play({ volume: 0.4 * volSFX });
        }
        if (estaNaParede) activePlayer.setVelocityY(50); 

        if (tentouPular && estaNaParede) {
            if (body.blocked.left) {
                activePlayer.setVelocityX(impulsoParedeX); activePlayer.setVelocityY(-380); activePlayer.setFlipX(false);
            } else if (body.blocked.right) {
                activePlayer.setVelocityX(-impulsoParedeX); activePlayer.setVelocityY(-380); activePlayer.setFlipX(true);
            }
            if (this.somPulando) this.somPulando.play({ volume: 0.4 * volSFX });
        }

        // Deixamos a física do knockback fluir se estiver stunned (não sobrescrevemos vx com input ou atrito alto)
        if (!this.jogadorAtual.stunned) {
            let vx = activePlayer.body.velocity.x;
            const aceleracao = noChao ? 18 : 10; 
            const atrito = noChao ? 25 : 5;      

            if (indoEsquerda) {
                vx -= aceleracao;
                if (vx < -velocidadeMax) vx = -velocidadeMax;
                activePlayer.setFlipX(true);
            } else if (indoDireita) {
                vx += aceleracao;
                if (vx > velocidadeMax) vx = velocidadeMax;
                activePlayer.setFlipX(false);
            } else {
                if (vx > 0) {
                    vx -= atrito;
                    if (vx < 0) vx = 0;
                } else if (vx < 0) {
                    vx += atrito;
                    if (vx > 0) vx = 0;
                }
            }
            activePlayer.setVelocityX(vx);
        }

        const char = this.personagemInicial; 
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
        } else if (body.velocity.x !== 0 && !this.jogadorAtual.stunned) {
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
        this.pararSonsMovimento();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (this.scene.isActive('Game')) {
                this.scene.stop('Game');
                this.scene.start('Mapa2', { personagem: this.personagemInicial });
            }
        });
    }
}
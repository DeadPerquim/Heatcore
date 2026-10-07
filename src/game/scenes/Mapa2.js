export class Mapa2 extends Phaser.Scene {
    constructor() {
        super('Mapa2');
    }

    create() {
        // ==========================================
        // 1. CRIAÇÃO DO MAPA
        // ==========================================
        const map = this.make.tilemap({ key: 'mapa2' });

        // Declara cada tileset em uma variável única
        const tsFundo = map.addTilesetImage('FundoMetal', 'FundoMetal');
        const tsPersonagens = map.addTilesetImage('Personagens', 'Personagens');
        const tsTexturas = map.addTilesetImage('texturas_tileset1', 'texturas_tileset1');
        const tsPedras = map.addTilesetImage('TilesPedra', 'TilesPedra');
        const tsEspinhos = map.addTilesetImage('Espinhos', 'Espinhos');

        // Cria um array com todos os tilesets para passar para as camadas
        const arrayTilesets = [tsFundo, tsPersonagens, tsTexturas, tsPedras, tsEspinhos];

        // Cria as camadas informando o array com todos os tilesets
        const layerPedras = map.createLayer('Pedras', arrayTilesets, 0, 0);
        const layerCenarioDeFundo = map.createLayer('CenarioDeFundo', arrayTilesets, 0, 0);
        const layerLimites = map.createLayer('Limites', arrayTilesets, 0, 0);
        const layerObjetos = map.createLayer('Objetos', arrayTilesets, 0, 0);
        const layerForeground = map.createLayer('Foreground', arrayTilesets, 0, 0);

        // A camada 'Limites' é a responsável pela colisão, como você configurou
        layerLimites.setCollisionByExclusion([-1]);
        layerObjetos.setCollisionByExclusion([-1]);
        
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // ==========================================
        // ESCURIDÃO COM FURO CIRCULAR (Canvas Texture)
        // ==========================================

        const largura = 2500; 
        const altura = 2500;
        const raioLuz = 24;   

        // Só cria a textura do canvas se ela ainda não existir no cache do jogo
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
        // 2. CRIAÇÃO DOS PERSONAGENS (Solar e Fornalha)
        // ==========================================
        this.solar = this.physics.add.sprite(247.5, 520, 'solar_andando');
        this.solar.setCircle(8); 
        this.solar.setCollideWorldBounds(true);

        this.fornalha = this.physics.add.sprite(680, 300, 'Fornalha');
        this.fornalha.setCircle(8);
        this.fornalha.setCollideWorldBounds(true);

        // Define o Solar como o personagem ativo inicial
        this.jogadorAtual = this.solar;

        // ==========================================
        // 2.1 CRIAÇÃO DOS TELEPORTADORES DE FASE 
        // ==========================================
        this.teleporters = this.physics.add.staticGroup();

        const teleporter1 = this.teleporters.create(210, 510, 'corredorEsquerdo').setVisible(false);
        const teleporter2 = this.teleporters.create(720, 290, 'corredorDireito').setVisible(false);

        // ==========================================
        // 3. COLISÕES E CÂMERA
        // ==========================================
        this.physics.add.collider(this.solar, layerLimites);
        this.physics.add.collider(this.solar, layerObjetos);
        this.physics.add.collider(this.fornalha, layerLimites);
        this.physics.add.collider(this.fornalha, layerObjetos);

        this.physics.add.overlap(this.solar, teleporter2, this.irParaProximaFase, null, this);
        this.physics.add.overlap(this.fornalha, teleporter1, this.irParaProximaFase, null, this);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.jogadorAtual);

        // ==========================================
        // 4. ANIMAÇÕES (Adaptadas para múltiplas spritesheets)
        // ==========================================
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('solar_andando', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('solar_pulando', { start: 2, end: 2 }),
            frameRate: 100
        });

        this.anims.create({
            key: 'fall',
            frames: this.anims.generateFrameNumbers('solar_caindo', { start: 2, end: 2 }),
            frameRate: 10
        });

        this.anims.create({
            key: 'wallSlide',
            frames: this.anims.generateFrameNumbers('solar_deslizando', { start: 1, end: 1 }),
            frameRate: 10
        });

        // ==========================================
        // 5. CONTROLES
        // ==========================================
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Teclas temporárias para alternar personagens (1 e 2)
        this.tecla1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.tecla2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    }

    update() {
        // ==========================================
        // TROCA TEMPORÁRIA DE PERSONAGEM (TECLAS 1 E 2)
        // ==========================================
        if (Phaser.Input.Keyboard.JustDown(this.tecla1)) {
            this.jogadorAtual = this.solar;
            this.cameras.main.startFollow(this.solar);
        } else if (Phaser.Input.Keyboard.JustDown(this.tecla2)) {
            this.jogadorAtual = this.fornalha;
            this.cameras.main.startFollow(this.fornalha);
            // Zera a velocidade do solar ao desselecionar para ele não continuar andando sozinho
            this.solar.setVelocityX(0);
            this.solar.anims.stop();
        }

        // A partir daqui, toda a lógica do update se aplica dinamicamente ao `this.jogadorAtual`
        const activePlayer = this.jogadorAtual;
        if (!activePlayer || !activePlayer.body) return;

        const body = activePlayer.body;
        const noChao = body.blocked.down || body.touching.down || body.onFloor();
        const apertouPulo = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space);     
        const isTouchingWall = body.blocked.left || body.blocked.right;
        const isFalling = body.velocity.y > 0;
        const tocandoParedeEsquerda = body.blocked.left;
        const tocandoParedeDireita = body.blocked.right;
        const estaNaParede = (tocandoParedeEsquerda || tocandoParedeDireita) && !noChao && isFalling;
        
        this.apertouE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.apertouW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.apertouA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.apertouS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.apertouD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.apertouP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        // ==========================================
        // 1. FÍSICA E MOVIMENTO (Apenas setVelocity)
        // ==========================================
        
        // Pulo
        if ((apertouPulo && noChao) || (this.apertouW.isDown && noChao)) {
            activePlayer.setVelocityY(-400); 
        }

        // Wall Slide
        if (estaNaParede) {
            activePlayer.setVelocityY(50); 
        }
        
        if ((apertouPulo && estaNaParede) || (this.apertouW.isDown && estaNaParede)) {
            if (this.cursors.right.isDown || this.apertouD.isDown) {
                activePlayer.setVelocityX(220);   
                activePlayer.setVelocityY(-380);  
            }
            else if (this.cursors.left.isDown || this.apertouA.isDown) {
                activePlayer.setVelocityX(-220);  
                activePlayer.setVelocityY(-380);  
            }
        }

        // Movimento Horizontal
        if (!this.timeWarp) {
            if (this.cursors.left.isDown || this.apertouA.isDown) {
                activePlayer.setVelocityX(-160);
                activePlayer.setFlipX(true);
            } 
            else if (this.cursors.right.isDown || this.apertouD.isDown) {
                activePlayer.setVelocityX(160);
                activePlayer.setFlipX(false);
            } 
            else {
                activePlayer.setVelocityX(0);
            }
        }

        // ==========================================
        // 2. GERENCIADOR DE ANIMAÇÕES (Apenas para o Solar por enquanto)
        // ==========================================
        if (activePlayer === this.solar) {
            if (isTouchingWall && !noChao && isFalling) {
                activePlayer.anims.play('wallSlide', true);
            } 
            else if (!noChao) {
                if (body.velocity.y < 0) {
                    activePlayer.anims.play('jump', true);
                } else {
                    activePlayer.anims.play('fall', true);
                }
            } 
            else if (body.velocity.x !== 0) {
                activePlayer.anims.play('walk', true);
            } 
            else {
                activePlayer.anims.stop();
                activePlayer.setTexture('solar_andando', 0); 
            }
        }

        if (this.escuridaoSprite && activePlayer) {
            this.escuridaoSprite.setPosition(activePlayer.x, activePlayer.y);
        }

        if (Phaser.Input.Keyboard.JustDown(this.apertouE)) {
            this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuro');
            this.escuridaoSprite.setDepth(100);
        }
    }

    irParaProximaFase(jogador, teleportador) {
        this.scene.stop('Mapa2');
        this.scene.start('Mapa3');
    }
}
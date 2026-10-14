export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        // ==========================================
        // 1. CRIAÇÃO DO MAPA
        // ==========================================
        const map = this.make.tilemap({ key: 'mapa' });

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

        const largura = 2500; // Tamanho suficiente para cobrir toda a visão do mapa
        const altura = 2500;
        const raioLuz = 24;   // Ajuste o tamanho do círculo de luz aqui (ex: 20, 24, 32)

        // 1. Cria uma textura em memória via Canvas nativo
        const canvasTexture = this.textures.createCanvas('escuridaoComFuro', largura, altura);
        const ctx = canvasTexture.context;

        // 2. Pinta o quadrado de preto semi-transparente (0.9 de opacidade)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, largura, altura);

        // 3. Fura um círculo perfeito exatamente no centro
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(largura / 2, altura / 2, raioLuz, 0, Math.PI * 2);
        ctx.fill();

        // 4. Atualiza a textura no Phaser
        canvasTexture.refresh();

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
            key: 'run',
            frames: this.anims.generateFrameNumbers('solar_correndo', { start: 1, end: 2 }), 
            frameRate: 15,
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

        this.input.gamepad.once('connected', function (pad) {
            console.log('Controle conectado:', pad.id);
        })

        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Teclas temporárias para alternar personagens (1 e 2)
        this.tecla1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.tecla2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    }

update() {
        // ==========================================
        // 1. TROCA TEMPORÁRIA DE PERSONAGEM (TECLAS 1 E 2)
        // ==========================================
        if (Phaser.Input.Keyboard.JustDown(this.tecla1)) {
            this.jogadorAtual = this.solar;
            this.cameras.main.startFollow(this.solar);
        } else if (Phaser.Input.Keyboard.JustDown(this.tecla2)) {
            this.jogadorAtual = this.fornalha;
            this.cameras.main.startFollow(this.fornalha);
            this.solar.setVelocityX(0);
            this.solar.anims.stop();
        }

        const activePlayer = this.jogadorAtual;
        if (!activePlayer || !activePlayer.body) return;

        const body = activePlayer.body;

        // ==========================================
        // 2. DEFINIÇÃO DE TECLAS
        // ==========================================
        this.apertouE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.apertouW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.apertouA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.apertouS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.apertouD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.apertouP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.apertouShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // ==========================================
        // 3. INTENÇÕES DE MOVIMENTO UNIFICADAS (Teclado + Controle)
        // ==========================================
        let indoEsquerda = this.cursors.left.isDown || this.apertouA.isDown;
        let indoDireita = this.cursors.right.isDown || this.apertouD.isDown;
        let tentouPular = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.apertouW.isDown;
        
        // Verifica se está a segurar SHIFT
        let estaCorrendo = this.apertouShift.isDown;

        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        if (pad) {
            const axisX = pad.leftStick.x;
            if (axisX < -0.2) indoEsquerda = true;
            if (axisX > 0.2) indoDireita = true;
            
            if (pad.A || (pad.buttons.length > 0 && pad.buttons[0].pressed)) {
                tentouPular = true;
            }

            // O gatilho RT no Phaser é geralmente o R2 ou o botão de índice 7
            // Verificamos se o valor da pressão é maior que 10% para evitar toques acidentais
            if (pad.R2 > 0.1 || (pad.buttons.length > 7 && pad.buttons[7].value > 0.1)) {
                estaCorrendo = true;
            }
        }

        // ==========================================
        // 4. ESTADOS DA FÍSICA (Mantém o que você já tem)
        // ==========================================
        const noChao = body.blocked.down || body.touching.down || body.onFloor();
        const isTouchingWall = body.blocked.left || body.blocked.right;
        const isFalling = body.velocity.y > 0;
        const estaNaParede = isTouchingWall && !noChao && isFalling;

        // ==========================================
        // 5. APLICAÇÃO DA FÍSICA E MOVIMENTO (Com Corrida)
        // ==========================================
        let executouWallJump = false;

        // Calcula a velocidade baseado em estar a correr ou não
        const velocidadeX = estaCorrendo ? 260 : 160; 
        const impulsoParedeX = estaCorrendo ? 320 : 220; // Pula mais longe da parede se estiver a correr

        // Pulo Normal
        if (tentouPular && noChao) {
            activePlayer.setVelocityY(-400); 
        }

        // Wall Slide
        if (estaNaParede) {
            activePlayer.setVelocityY(50); 
        }

        // Pulo na Parede (Wall Jump)
        if (tentouPular && estaNaParede) {
            executouWallJump = true;
            if (indoDireita) { 
                activePlayer.setVelocityX(impulsoParedeX);   
                activePlayer.setVelocityY(-380);  
            }
            else if (indoEsquerda) { 
                activePlayer.setVelocityX(-impulsoParedeX);  
                activePlayer.setVelocityY(-380);  
            }
        }

        // Movimento Horizontal Normal
        if (!executouWallJump) {
            if (indoEsquerda) {
                activePlayer.setVelocityX(-velocidadeX);
                activePlayer.setFlipX(true);
            } 
            else if (indoDireita) {
                activePlayer.setVelocityX(velocidadeX);
                activePlayer.setFlipX(false);
            } 
            else {
                activePlayer.setVelocityX(0); 
            }
        }

        // ==========================================
        // 6. GERENCIADOR DE ANIMAÇÕES
        // ==========================================
        if (activePlayer === this.solar) {
            if (isTouchingWall && !noChao && isFalling) {
                activePlayer.anims.play('wallSlide', true);
            } 
            else if (!noChao && Math.abs(body.velocity.y) > 15) {
                if (body.velocity.y < 0) {
                    activePlayer.anims.play('jump', true);
                } else {
                    activePlayer.anims.play('fall', true);
                }
            } 
            else if (body.velocity.x !== 0) {
                if (estaCorrendo) {
                    activePlayer.anims.play('run', true);
                } else {
                    activePlayer.anims.play('walk', true);
                }
            } 
            else {
                activePlayer.anims.stop();
                activePlayer.setTexture('solar_andando', 0); 
            }
        }

        // ==========================================
        // 7. LÓGICA DA ESCURIDÃO
        // ==========================================
        if (this.escuridaoSprite && activePlayer) {
            this.escuridaoSprite.setPosition(activePlayer.x, activePlayer.y);
        }

        if (Phaser.Input.Keyboard.JustDown(this.apertouE)) {
            this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuro');
            this.escuridaoSprite.setDepth(100);
        }
    }

    irParaProximaFase(jogador, teleportador) {
        this.scene.stop('Game');
        this.scene.start('Mapa2');
    }
}
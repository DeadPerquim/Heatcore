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
        // 2. CRIAÇÃO DO JOGADOR
        // ==========================================
        // Usamos uma sprite inicial, por exemplo, o sprite de 'andando'
        this.solar = this.physics.add.sprite(247.5, 520, 'solar_andando');
        this.solar.setCircle(8); 
        this.solar.setCollideWorldBounds(true);

        // ==========================================
        // 2.1 CRIAÇÃO DOS TELEPORTADORES DE FASE 
        // ==========================================
        this.teleporter = this.add.sprite(210, 510, 'corredorEsquerdo');
        this.teleporter = this.add.sprite(720, 290, 'corredorDireito');

        // ==========================================
        // 3. COLISÕES E CÂMERA
        // ==========================================
        this.physics.add.collider(this.solar, layerLimites);
        this.physics.add.collider(this.solar, layerObjetos);
        this.physics.add.overlap(this.solar, this.teleporter, this.irParaProximaFase, null, this)

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.solar);

        // ==========================================
        // 4. ANIMAÇÕES (Adaptadas para múltiplas spritesheets)
        // ==========================================
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('solar_andando', { start: 0, end: 2 }), // Lê apenas a primeira linha
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('solar_pulando', { start: 2, end:  2}), // Substitua 1 pelo quadro correto do pulo
            frameRate: 100
        });

        this.anims.create({
            key: 'fall',
            frames: this.anims.generateFrameNumbers('solar_caindo', { start: 2, end: 2 }), // Substitua 2 pelo quadro correto dele olhando para baixo
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
    }

update() {
if (!this.solar || !this.solar.body) return;

        const body = this.solar.body;
        const noChao = body.blocked.down || body.touching.down || body.onFloor();
        const apertouPulo = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space);     
        const isTouchingWall = body.blocked.left || body.blocked.right;
        const isFalling = body.velocity.y > 0;
        const tocandoParedeEsquerda = body.blocked.left;
        const tocandoParedeDireita = body.blocked.right;
        const estaNaParede = (tocandoParedeEsquerda || tocandoParedeDireita) && !noChao && isFalling;
        const naParedEsquerda = body.blocked.left || body.touching.left;
        const naParedDireita = body.blocked.right || body.touching.right;
        const estaNoAr = !noChao;
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
        if (apertouPulo && noChao || (this.apertouW.isDown) && noChao) {
            this.solar.setVelocityY(-400); 
        }

        // Wall Slide
        if (estaNaParede) {
            this.solar.setVelocityY(50); // Controla a velocidade de queda na parede
        }
        
        if (apertouPulo && estaNaParede || (this.apertouW.isDown) && estaNaParede) {
            if (this.cursors.right.isDown || (this.apertouD.isDown)) {
                this.solar.setVelocityX(220);   // Impulso para a direita
                this.solar.setVelocityY(-380);  // Impulso para cima
            }
            else if (this.cursors.left.isDown || (this.apertouA.isDown)) {
                this.solar.setVelocityX(-220);  // Impulso para a esquerda
                this.solar.setVelocityY(-380);  // Impulso para cima
            }
        }

        // Movimento Horizontal
        if (!this.timeWarp) {
            if (this.cursors.left.isDown || (this.apertouA.isDown)) {
                this.solar.setVelocityX(-160);
                this.solar.setFlipX(true);
            } 
            else if (this.cursors.right.isDown || (this.apertouD.isDown)) {
                this.solar.setVelocityX(160);
                this.solar.setFlipX(false);
            } 
            else {
                this.solar.setVelocityX(0);
            }
        }

        // ==========================================
        // 2. GERENCIADOR DE ANIMAÇÕES (Apenas anims.play)
        // ==========================================
        
        // A ordem dos 'if' define a prioridade. Ações no ar importam mais que no chão.
        if (isTouchingWall && !noChao && isFalling) {
            this.solar.anims.play('wallSlide', true);
        } 
        else if (!noChao) {
            // Se não está no chão, está no ar (pulando ou caindo)
            if (body.velocity.y < 0) {
                this.solar.anims.play('jump', true);
            } else {
                this.solar.anims.play('fall', true);
            }
        } 
        else if (body.velocity.x !== 0) {
            // Se está no chão e com velocidade, está andando
            this.solar.anims.play('walk', true);
        } 
        else {
            // Se está no chão e parado
            this.solar.anims.stop();
            // Volta para a textura original caso a última animação pare em um frame estranho
            this.solar.setTexture('solar_andando', 0); 
        }

        if (this.escuridaoSprite && this.solar) {
            this.escuridaoSprite.setPosition(this.solar.x, this.solar.y);
        }

        if (Phaser.Input.Keyboard.JustDown(this.apertouE)) {
            this.escuridaoSprite = this.add.image(0, 0, 'escuridaoComFuro');
            this.escuridaoSprite.setDepth(100);
        }

        if (Phaser.Input.Keyboard.JustDown(this.apertouP)) {
            this.scene.stop();
            this.scene.start("Mapa2");
        }
    }
}
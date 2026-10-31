import { Scene } from "phaser";

export class Diario extends Scene {
    constructor() {
        super('Diario');
    }

    init(data) {
        this.offsetHoras = data ? (data.offsetHoras || 0) : 0;
        this.personagemInicial = data ? (data.personagem || 'solar') : 'solar';
        this.modoDiario = data ? (data.modoDiario || 'PLATAFORMAS') : 'PLATAFORMAS'; 

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
        this.outroPersonagemTipo = this.personagemInicial === 'solar' ? 'fornalha' : 'solar';

        if (this.socket) {
            this.socket.off('voltarAoMenuGeral'); 
            this.socket.on('voltarAoMenuGeral', () => {
                this.voltarParaMenu();
            });
        }

        const dataSimulada = new Date();
        dataSimulada.setHours(dataSimulada.getHours() + this.offsetHoras);

        let hashModo = 0;
        for (let i = 0; i < this.modoDiario.length; i++) {
            hashModo += this.modoDiario.charCodeAt(i);
        }

        let currentSeed = (dataSimulada.getUTCFullYear() * 1000000) + 
                        ((dataSimulada.getUTCMonth() + 1) * 10000) + 
                        (dataSimulada.getUTCDate() * 100) + 
                        dataSimulada.getUTCHours() + 
                        this.offsetHoras + 
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
            this.somQueda = this.sound.add('som_queda', { volume: volSFX });
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
                    let pilarAltura = Math.floor(randomDiario() * 3) + 2;
                    let pilarX = x + larguraPlat;
                    if (pilarX <= endX - 2) { 
                        for (let p = 0; p < pilarAltura; p++) {
                            layerLimites.putTileAt(COR_MAPA_HOJE, pilarX, currentY - p);
                        }
                    }
                }
            }

        } else if (this.modoDiario === 'LABIRINTO') {
            let labirintoValido = false;
            let tentativas = 0;
            let gridLogico = [];
            
            const passo = 4;
            const offsetX = 3;
            const offsetY = 7; // Deslocado para baixo para caber a sala de teleporte
            
            const cols = Math.floor((larg - 6) / passo);
            const rows = Math.floor((alt - offsetY - 6) / passo);
    
            // Ambos começam no meio embaixo e terminam no meio em cima
            let startC = Math.floor(cols / 2);
            let startR = rows - 1;
            let endC = Math.floor(cols / 2);
            let endR = 0;

            while (!labirintoValido && tentativas < 20) {
                tentativas++;
                gridLogico = Array.from({length: cols}, () => Array.from({length: rows}, () => ({ right: false, down: false })));

                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        if (c < cols - 1 && randomDiario() > 0.4) gridLogico[c][r].right = true;
                        if (r < rows - 1 && randomDiario() > 0.4) gridLogico[c][r].down = true;
                    }
                }

                let visited = Array.from({length: cols}, () => Array(rows).fill(false));
                let queue = [[startC, startR]];
                visited[startC][startR] = true;
                let achouFim = false;

                while(queue.length > 0) {
                    let [c, r] = queue.shift();
                    
                    if (c === endC && r === endR) {
                        achouFim = true;
                        break;
                    }

                    if (c < cols - 1 && gridLogico[c][r].right && !visited[c+1][r]) {
                        visited[c+1][r] = true; queue.push([c+1, r]);
                    }
                    if (c > 0 && gridLogico[c-1][r].right && !visited[c-1][r]) {
                        visited[c-1][r] = true; queue.push([c-1, r]);
                    }
                    if (r < rows - 1 && gridLogico[c][r].down && !visited[c][r+1]) {
                        visited[c][r+1] = true; queue.push([c, r+1]);
                    }
                    if (r > 0 && gridLogico[c][r-1].down && !visited[c][r-1]) {
                        visited[c][r-1] = true; queue.push([c, r-1]);
                    }
                }

                labirintoValido = achouFim;
                
                if (!labirintoValido && tentativas === 15) {
                    gridLogico = Array.from({length: cols}, () => Array.from({length: rows}, () => ({ right: false, down: false })));
                    let visitedDFS = Array.from({length: cols}, () => Array(rows).fill(false));
                    let stack = [[startC, startR]];
                    visitedDFS[startC][startR] = true;

                    while(stack.length > 0) {
                        let [c, r] = stack[stack.length - 1];
                        let unvisited = [];
                        
                        if (c > 0 && !visitedDFS[c-1][r]) unvisited.push([c-1, r, 'left']);
                        if (c < cols-1 && !visitedDFS[c+1][r]) unvisited.push([c+1, r, 'right']);
                        if (r > 0 && !visitedDFS[c][r-1]) unvisited.push([c, r-1, 'up']);
                        if (r < rows-1 && !visitedDFS[c][r+1]) unvisited.push([c, r+1, 'down']);

                        if (unvisited.length > 0) {
                            let next = unvisited[Math.floor(randomDiario() * unvisited.length)];
                            visitedDFS[next[0]][next[1]] = true;
                            
                            if (next[2] === 'left') gridLogico[c-1][r].right = true;
                            if (next[2] === 'right') gridLogico[c][r].right = true;
                            if (next[2] === 'up') gridLogico[c][r-1].down = true;
                            if (next[2] === 'down') gridLogico[c][r].down = true;
                            
                            stack.push([next[0], next[1]]);
                        } else {
                            stack.pop();
                        }
                    }

                    for (let c = 0; c < cols; c++) {
                        for (let r = 0; r < rows; r++) {
                            if (c < cols - 1 && !gridLogico[c][r].right && randomDiario() > 0.8) gridLogico[c][r].right = true;
                            if (r < rows - 1 && !gridLogico[c][r].down && randomDiario() > 0.8) gridLogico[c][r].down = true;
                        }
                    }
                    labirintoValido = true;
                }
            }

            for (let x = 0; x < larg; x++) {
                for (let y = 0; y < alt; y++) {
                    layerLimites.putTileAt(COR_MAPA_HOJE, x, y);
                }
            }

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    let px = offsetX + c * passo;
                    let py = offsetY + r * passo;
                    
                    for (let cx = 0; cx < 3; cx++) {
                        for (let cy = 0; cy < 3; cy++) {
                            layerLimites.removeTileAt(px + cx, py + cy);
                        }
                    }

                    if (c < cols - 1 && gridLogico[c][r].right) {
                        for (let k = 0; k < passo; k++) {
                            layerLimites.removeTileAt(px + 2 + k, py);
                            layerLimites.removeTileAt(px + 2 + k, py + 1);
                            layerLimites.removeTileAt(px + 2 + k, py + 2);
                        }
                    }
                    if (r < rows - 1 && gridLogico[c][r].down) {
                        for (let k = 0; k < passo; k++) {
                            layerLimites.removeTileAt(px, py + 2 + k);
                            layerLimites.removeTileAt(px + 1, py + 2 + k);
                            layerLimites.removeTileAt(px + 2, py + 2 + k);
                        }
                    }
                }
            }

            const meioX = Math.floor(larg / 2);

            // === SALA DE SAÍDA (CIMA) ===
            for (let x = meioX - 5; x <= meioX + 5; x++) {
                for (let y = 2; y <= 7; y++) {
                    layerLimites.removeTileAt(x, y);
                }
                layerLimites.putTileAt(COR_MAPA_HOJE, x, 7); // Chão da sala de saída
            }
            
            // Furo no chão da saída conectando ao fim do labirinto
            let pxEnd = offsetX + endC * passo;
            layerLimites.removeTileAt(pxEnd, 7);
            layerLimites.removeTileAt(pxEnd + 1, 7);
            layerLimites.removeTileAt(pxEnd + 2, 7);

            // === SALA DE SPAWN (BAIXO) ===
            let pyStart = offsetY + (rows - 1) * passo;
            let floorOfMaze = pyStart + 3;

            for (let x = meioX - 5; x <= meioX + 5; x++) {
                for (let y = floorOfMaze; y <= alt - 1; y++) {
                    layerLimites.removeTileAt(x, y);
                }
                layerLimites.putTileAt(COR_MAPA_HOJE, x, alt - 2); // Chão do spawn
            }
            
            // Furo garantido conectando o spawn ao início do labirinto
            let pxStart = offsetX + startC * passo;
            for(let y = pyStart; y <= floorOfMaze; y++) {
                layerLimites.removeTileAt(pxStart, y);
                layerLimites.removeTileAt(pxStart + 1, y);
                layerLimites.removeTileAt(pxStart + 2, y);
            }
        }

        layerLimites.setCollisionByExclusion([-1]);
        layerObjetos.setCollisionByExclusion([-1]);
        
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, false);

        const TW = map.tileWidth;
        const TH = map.tileHeight;

        let posicoesSpawn, posicoesTeleporter;

        if (this.modoDiario === 'PLATAFORMAS') {
            posicoesSpawn = {
                solar: { x: (4 * TW) + (TW / 2), y: (ySolar - 2) * TH },
                fornalha: { x: ((larg - 6) * TW) + (TW / 2), y: (yFornalha - 2) * TH }
            };
            posicoesTeleporter = {
                solar: { x: (larg - 4) * TW, y: (yFornalha - 1) * TH, sprite: 'corredorDireito' },
                fornalha: { x: 3 * TW, y: (ySolar - 1) * TH, sprite: 'corredorEsquerdo' }
            };
        } else {
            const meioX = Math.floor(map.width / 2);
            const alt = map.height;
            posicoesSpawn = {
                solar: { x: (meioX * TW) - 32, y: (alt - 3) * TH },
                fornalha: { x: (meioX * TW) + 32, y: (alt - 3) * TH }
            };
            posicoesTeleporter = {
                solar: { x: (meioX * TW) - 48, y: 6 * TH, sprite: 'corredorDireito' },
                fornalha: { x: (meioX * TW) + 48, y: 6 * TH, sprite: 'corredorEsquerdo' }
            };
        }

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

        this.mapaAlturaTotal = map.heightInPixels;

        this.teleporters = this.physics.add.staticGroup();
        const telFornalhaPos = posicoesTeleporter.fornalha;
        const telSolarPos = posicoesTeleporter.solar;

        const teleporter1 = this.teleporters.create(telFornalhaPos.x, telFornalhaPos.y, telFornalhaPos.sprite).setVisible(false);
        const teleporter2 = this.teleporters.create(telSolarPos.x, telSolarPos.y, telSolarPos.sprite).setVisible(false);

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
        this.isKicking = false;
        this.levouChute = false;
        this.ultimoEstadoBater = false;

        this.input.keyboard.on('keydown', (event) => {
            if (this.jaEstaSaindo) return;
            
            if (event.key === 'q' || event.key === 'Q') {
                this.escuroAtivo = !this.escuroAtivo;
                if (this.escuridaoSprite) {
                    this.escuridaoSprite.setVisible(this.escuroAtivo);
                }
            }
            
            if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
                this.scene.restart({ offsetHoras: this.offsetHoras + 1, personagem: this.personagemInicial, modoDiario: this.modoDiario });
            }
            if (event.key === '-' || event.code === 'NumpadSubtract') {
                this.scene.restart({ offsetHoras: this.offsetHoras - 1, personagem: this.personagemInicial, modoDiario: this.modoDiario });
            }
            if (event.key === 'Escape') {
                this.voltarParaMenu();
            }
        });

        this.uiContainer = this.add.container(0, 0).setDepth(190);
        this.uiContainer.setScrollFactor(0);

        let stringData = dataSimulada.toLocaleDateString() + " " + dataSimulada.getHours() + ":00";
        let textoOffset = this.offsetHoras === 0 ? "AGORA" : (this.offsetHoras > 0 ? `+${this.offsetHoras} HORA(S)` : `${this.offsetHoras} HORA(S)`);

        const txtData = this.add.text(40, 25, `MAPA HORÁRIO: ${textoOffset} (${stringData})`, {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", stroke: "#000000", strokeThickness: 3
        });
        this.uiContainer.add(txtData);

        this.adicionarFiltroVisao();

        this.somAndando = this.sound.add('sfx_andando', { loop: true, volume: 0.25 * volSFX });
        this.somCorrendo = this.sound.add(this.personagemInicial === 'solar' ? 'sfx_correndo_solar' : 'sfx_correndo_fornalha', { loop: true, volume: 0.25 * volSFX });
        this.somPulando = this.sound.add('sfx_pulando', { volume: 0.4 * volSFX });

        if (this.mostrarTutorialInicial) {
            this.jogadoresProntos = false; 
            this.criarOverlayControles();
        } else {
            this.jogadoresProntos = true; 
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

        const cx = sw * 0.75;
        const cy = sh * 0.50;

        this.containerBotoes.add(this.add.text(cx, cy - 110, "[ INPUT: GAMEPAD ]", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 20, color: "#ffffff", fontStyle: "bold" 
        }).setOrigin(0.5));

        const bumperY = cy - 80;

        graficosBotoes.lineStyle(2, 0x00f3ff, 0.8);
        graficosBotoes.fillStyle(0x001a33, 0.8);
        graficosBotoes.fillRoundedRect(cx - 100, bumperY, 50, 18, 5); 
        graficosBotoes.strokeRoundedRect(cx - 100, bumperY, 50, 18, 5);
        this.containerBotoes.add(this.add.text(cx - 75, bumperY + 9, "L", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#00f3ff", fontStyle: "bold" 
        }).setOrigin(0.5));

        graficosBotoes.lineStyle(2, 0xff9900, 0.8);
        graficosBotoes.fillStyle(0x331a00, 0.8);
        graficosBotoes.fillRoundedRect(cx + 50, bumperY, 50, 18, 5); 
        graficosBotoes.strokeRoundedRect(cx + 50, bumperY, 50, 18, 5);
        this.containerBotoes.add(this.add.text(cx + 75, bumperY + 9, "R", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#ff9900", fontStyle: "bold" 
        }).setOrigin(0.5));
        
        this.containerBotoes.add(this.add.text(cx + 75, bumperY - 12, "CORRER", { 
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#aaaaaa" 
        }).setOrigin(0.5));

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
            targets: this.overlayControles,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.overlayControles.setVisible(false);
            }
        });
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
        const char = this.personagemInicial; 
        
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
        const limiteQueda = this.mapaAlturaTotal + 40; 
        
        if (this.jogadorAtual && this.jogadorAtual.y > limiteQueda && !this.jogadorAtual.estaRenascendo) {
            this.jogadorAtual.estaRenascendo = true;

            if (this.somQueda) {
                this.somQueda.stop();
                this.somQueda.play({ volume: volSFX });
            } else if (this.cache.audio.has('caindo')) {
                this.sound.play('caindo', { volume: volSFX });
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
        
        let apertouBaterAgora = false;
        if (this.apertouE.isDown || this.apertouCtrl.isDown) apertouBaterAgora = true;

        const padAtivo = pad || (typeof navigator !== 'undefined' && navigator.getGamepads && navigator.getGamepads().filter(p => p).length > 0);

        if (padAtivo) {
            const axisX = (pad && pad.leftStick ? pad.leftStick.x : 0) || getAxisValue(pad, 0);
            if (axisX < -0.2 || (pad && pad.left) || isBtnPressed(pad, 14)) indoEsquerda = true;
            if (axisX > 0.2 || (pad && pad.right) || isBtnPressed(pad, 15)) indoDireita = true;

            if (isBtnPressed(pad, 2)) tentouPular = true;
            if (isBtnPressed(pad, 3) || isBtnPressed(pad, 5) || (pad && pad.R2 && pad.R2 > 0.1)) estaCorrendo = true;

            if (isBtnPressed(pad, 0) || (pad && pad.X)) apertouBaterAgora = true;

            if (isBtnPressed(pad, 8) || isBtnPressed(pad, 9)) {
                this.pararSonsMovimento();
                this.voltarParaMenu();
                return;
            }
        }

        if (apertouBaterAgora && !this.ultimoEstadoBater && !this.isKicking) {
            this.isKicking = true;
            
            // --- LÓGICA DO EFEITO SONORO "SFX_BATER" ---
            // Verifica se o outro jogador existe na tela e está visível
            if (this.outroSprite && this.outroSprite.visible) {
                // Calcula a distância entre você (jogadorAtual) e o outro sprite
                const dist = Phaser.Math.Distance.Between(
                    this.jogadorAtual.x, this.jogadorAtual.y, 
                    this.outroSprite.x, this.outroSprite.y
                );
                
                // Você pediu um raio de 5 pixels. 
                // DICA: Em jogos 2D, 5 pixels significa que os personagens estão praticamente sobrepostos um no outro (o hitbox do seu chute real é de 70 pixels no código). 
                // Se notar que o som não está saindo quando você bate, recomendo alterar o "5" para "50" ou "70".
                if (dist <= 5) {
                    const volSFX = this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7;
                    this.sound.play('sfx_bater', { volume: volSFX });
                }
            }
            // ------------------------------------------

            setTimeout(() => this.isKicking = false, 400); 
        }
        this.ultimoEstadoBater = apertouBaterAgora;

        if (!this.jogadoresProntos) {
            indoEsquerda = false; indoDireita = false; tentouPular = false; estaCorrendo = false; apertouBaterAgora = false;

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
        this.pararSonsMovimento();
        
        const volSFX = this.game.volumeSFX !== undefined ? this.game.volumeSFX : 0.7;
        this.sound.play('sfx_vitoria', { volume: volSFX });
        
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
        this.containerVitoria.setScrollFactor(0);

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

        const txtTerminal = this.add.text(45, 45, "HEATCORE_OS // SIMULAÇÃO HORARIA COMPLETA\n> UPLINK ESTABELECIDO...\n> VENCEDOR IDENTIFICADO:", {
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
            const chaveSprite = this.personagemInicial === 'solar' ? 'solar_andando' : 'fornalha_andando';
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
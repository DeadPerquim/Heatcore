import { Scene } from "phaser";

export class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    this.add.image(400, 225, "background");
    this.add.rectangle(400, 400, 468, 32).setStrokeStyle(4, 0xffffff);
    const bar = this.add.rectangle(400 - 230, 400, 4, 28, 0xffffff);

    this.load.on("progress", (progress) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // 1. CARREGAR O MAPA
    this.load.tilemapTiledJSON('mapa', './assets/maps/_mapasdojogo/Mapa1.json');

    // ATENÇÃO: As imagens devem ser arquivos de imagem (.png) e não os dados .tsj
    this.load.image('FundoMetal', './assets/sprites/background-images/FundoMetal.png');
    this.load.image('Personagens', './assets/sprites/characters/Personagens.png');
    this.load.image('texturas_tileset1', './assets/sprites/environment/texturas_tileset1.png');
    this.load.image('TilesPedra', './assets/sprites/environment/TilesPedra.png');
    this.load.image('Espinhos', './assets/sprites/environment/Espinhos.png');

    // 2. CARREGAR OS SPRITESHEETS DO PERSONAGEM (Com chaves únicas)
    this.load.spritesheet('solar_andando', './assets/sprites/characters/Solar/Andando.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_caindo', './assets/sprites/characters/Solar/Caindo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_correndo', './assets/sprites/characters/Solar/Correndo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_deslizando', './assets/sprites/characters/Solar/DeslizandoParede.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('solar_pulando', './assets/sprites/characters/Solar/Pulando.png', { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    this.scene.stop();
    this.scene.start("MainMenu");
  }
}
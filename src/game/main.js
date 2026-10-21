import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { Mapa2 } from "./scenes/Mapa2";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { AUTO, Game } from "phaser";
import { Diario } from "./scenes/Diario.js";
import { PlacarTransicao } from './scenes/PlacarTransicao.js';
import { Creditos } from './scenes/Creditos';

const config = {
  type: AUTO,
  width: 800,
  height: 450,
  pixelArt: true,
  input: {
      gamepad: true
  },
  parent: "game-container",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: true,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver, Mapa2, Diario, PlacarTransicao, Creditos],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;

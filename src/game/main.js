import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { Mapa1 } from "./scenes/Mapa1";
import { Mapa2 } from "./scenes/Mapa2";
import { Mapa3 } from "./scenes/Mapa3";
import { Mapa4 } from "./scenes/Mapa4";
import { Mapa5 } from "./scenes/Mapa5";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { AUTO, Game } from "phaser";
import { Diario } from "./scenes/Diario.js";
import { PlacarTransicao } from './scenes/PlacarTransicao.js';
import { Creditos } from './scenes/Creditos';
import { Salas } from './scenes/Salas';
import { Placar } from './scenes/Placar';
import { Avaliar } from "./scenes/Avaliar";


const config = {
  type: AUTO,
  width: 800,
  height: 450,
  pixelArt: true,
  input: {
      gamepad: true
  },
  dom: { createContainer: true },
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
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver, Mapa1, Mapa2, Mapa3, Mapa4, Mapa5, Diario, PlacarTransicao, Creditos, Salas, Avaliar],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;

import { Scene } from "phaser";

export class Placar extends Scene {
    constructor() {
        super('Placar');
    }

    create() {
        const { width, height } = this.scale;
        
        // Fundo
        this.add.rectangle(0, 0, width, height, 0x0a0a12, 1).setOrigin(0);
        let linhasTV = this.add.graphics();
        linhasTV.fillStyle(0x000000, 0.4);
        for(let i = 0; i < height; i += 4) linhasTV.fillRect(0, i, width, 2);
        
        this.add.text(width / 2, 40, ">> LEADERBOARD GLOBAL <<", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 32, color: "#ff9900", fontStyle: "bold",
            stroke: "#000", strokeThickness: 4, shadow: { offsetX: 0, offsetY: 0, color: '#ff9900', blur: 8, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, 75, "(RESETA A CADA 1 HORA)", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#00f3ff"
        }).setOrigin(0.5);

        const horaAtual = Math.floor(Date.now() / 3600000);
        let lb = JSON.parse(localStorage.getItem('heatcore_lb') || '{"hora":0,"atual":{},"anterior":{}}');
        
        if (lb.hora !== horaAtual) {
            lb.anterior = lb.atual;
            lb.atual = {};
            lb.hora = horaAtual;
            localStorage.setItem('heatcore_lb', JSON.stringify(lb));
        }

        const formatarTempo = (ms) => {
            if (ms === Infinity || ms === undefined || ms === null) return "--:--.--";
            let m = Math.floor(ms / 60000);
            let s = Math.floor((ms % 60000) / 1000);
            let mil = Math.floor((ms % 1000) / 10);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${mil.toString().padStart(2, '0')}`;
        };

        const renderPlacar = (x, y, titulo, chave) => {
            this.add.text(x, y, `[ ${titulo} ]`, { fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
            
            let recAtual = lb.atual[chave];
            let txtAtual = recAtual ? `${recAtual.nome} - ${formatarTempo(recAtual.tempo)}` : "NENHUM REGISTRO";
            this.add.text(x, y + 40, txtAtual, { fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#00ff66" }).setOrigin(0.5);

            let recAnt = lb.anterior[chave];
            let txtAnt = recAnt ? `${recAnt.nome} - ${formatarTempo(recAnt.tempo)}` : "---";
            this.add.text(x, y + 70, `HORA ANTERIOR:\n${txtAnt}`, { fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#8888aa", align: 'center' }).setOrigin(0.5);
        };

        // Coluna Esquerda (História Total)
        renderPlacar(width * 0.2, height * 0.35, "HISTÓRIA", 'historia');

        // Coluna Meio (Mapas)
        renderPlacar(width * 0.5, height * 0.25, "MAPA 1", 'mapa1');
        renderPlacar(width * 0.5, height * 0.45, "MAPA 2", 'mapa2');
        renderPlacar(width * 0.5, height * 0.65, "MAPA 3", 'mapa3');

        // Coluna Direita (Diário - Plataformas/Labirinto)
        renderPlacar(width * 0.8, height * 0.35, "MODO HORARIO", 'horario');

        const btnVoltar = this.add.text(width / 2, height - 40, "> VOLTAR [ESC / A] <", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnVoltar.on('pointerdown', () => this.scene.start('MainMenu'));

        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    update() {
        const pad = this.input.gamepad ? this.input.gamepad.pad1 : null;
        const apertouVoltar = (pad && pad.buttons[1] && (pad.buttons[1].pressed || pad.buttons[1].value > 0.5));
        
        if (Phaser.Input.Keyboard.JustDown(this.keyEsc) || apertouVoltar) {
            this.scene.start('MainMenu');
        }
    }
}
import { Scene } from "phaser";

export class PlacarTransicao extends Scene {
    constructor() {
        super('PlacarTransicao');
    }

    init(data) {
        this.proximaCena = data.proximaCena || 'Mapa3';
        this.personagemInicial = data.personagem || 'solar';
        this.pontosAntigosSolar = data.pontosSolar || 0;
        this.pontosAntigosFornalha = data.pontosFornalha || 0;
        this.quemMarcou = data.quemMarcou || 'solar'; // Identifica com precisão quem passou o portal

        // Incrementa o ponto corretamente para quem marcou
        this.pontosNovosSolar = this.pontosAntigosSolar + (this.quemMarcou === 'solar' ? 1 : 0);
        this.pontosNovosFornalha = this.pontosAntigosFornalha + (this.quemMarcou === 'fornalha' ? 1 : 0);
    }

    create() {
        const larguraTela = this.scale.width;
        const alturaTela = this.scale.height;

        // 1. Fundo totalmente preto
        this.add.rectangle(0, 0, larguraTela * 2, alturaTela * 2, 0x000000)
            .setScrollFactor(0)
            .setDepth(300);

        // 2. Sprites corretos dos personagens nas pontas
        const spriteSolar = this.add.sprite(larguraTela / 2 - 200, alturaTela / 2 - 10, 'solar_andando', 0)
            .setScale(2.5)
            .setScrollFactor(0)
            .setDepth(301);

        const spriteFornalha = this.add.sprite(larguraTela / 2 + 200, alturaTela / 2 - 10, 'Fornalha')
            .setScale(2.5)
            .setScrollFactor(0)
            .setDepth(301);

        // Nomes sob os sprites
        this.add.text(larguraTela / 2 - 200, alturaTela / 2 + 50, "SOLAR", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#ffffff"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(larguraTela / 2 + 200, alturaTela / 2 + 50, "FORNALHA", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 14, color: "#ffffff"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // 3. Exibição inicial do placar antigo (ex: "0 x 0")
        const textoPlacar = this.add.text(larguraTela / 2, alturaTela / 2 - 10, `${this.pontosAntigosSolar} x ${this.pontosAntigosFornalha}`, {
            fontFamily: "'Courier New', Courier, monospace", 
            fontSize: 42, 
            color: "#ffff00", 
            stroke: "#000000", 
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

        // 4. Animação interativa do placar atualizando após 1 segundo
        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: textoPlacar,
                scale: { from: 1, to: 1.25 },
                duration: 200,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });

            // Mostra o placar atualizado com o ponto somado corretamente
            textoPlacar.setText(`${this.pontosNovosSolar} x ${this.pontosNovosFornalha}`);
            textoPlacar.setColor("#00ff00");
        });

        // 5. Transição suave para a próxima fase após 3.5 segundos
        this.time.delayedCall(3500, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(this.proximaCena, {
                    personagem: this.personagemInicial,
                    pontosSolar: this.pontosNovosSolar,
                    pontosFornalha: this.pontosNovosFornalha
                });
            });
        });
    }
}
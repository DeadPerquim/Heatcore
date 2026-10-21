import { Scene } from "phaser";

export class PlacarTransicao extends Scene {
    constructor() {
        super('PlacarTransicao');
    }

    init(data) {
        // 🛡️ PRESERVA RESSALTADAMENTE A IDENTIDADE REAL DO JOGADOR LOCAL
        this.personagemInicial = this.game.meuPersonagem || (data && data.personagem) || 'solar';
        this.proximaCena = data ? (data.proximaCena || 'Mapa3') : 'Mapa3';
        this.pontosAntigosSolar = data ? (data.pontosSolar || 0) : 0;
        this.pontosAntigosFornalha = data ? (data.pontosFornalha || 0) : 0;
        this.quemMarcou = data ? (data.quemMarcou || 'solar') : 'solar';

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

        // 2. Previews dos personagens cortados de Personagens.png (como no MainMenu)
        let spriteSolar, spriteFornalha;

        if (this.textures.exists('Personagens')) {
            const tex = this.textures.get('Personagens');
            const img = tex.getSourceImage();
            const halfW = Math.floor(img.width / 2);
            const h = img.height;

            const frameSolarKey = 'preview_solar_frame';
            const frameFornalhaKey = 'preview_fornalha_frame';

            if (!tex.has(frameSolarKey)) {
                tex.add(frameSolarKey, 0, 0, 0, halfW, h);
            }
            if (!tex.has(frameFornalhaKey)) {
                tex.add(frameFornalhaKey, 0, halfW, 0, halfW, h);
            }

            spriteSolar = this.add.image(larguraTela / 2 - 200, alturaTela / 2 - 10, 'Personagens', frameSolarKey)
                .setDisplaySize(100, 100)
                .setScrollFactor(0)
                .setDepth(301);

            spriteFornalha = this.add.image(larguraTela / 2 + 200, alturaTela / 2 - 10, 'Personagens', frameFornalhaKey)
                .setDisplaySize(100, 100)
                .setScrollFactor(0)
                .setDepth(301);
        } else {
            // Fallback caso Personagens ainda não tenha sido carregado
            spriteSolar = this.add.sprite(larguraTela / 2 - 200, alturaTela / 2 - 10, 'solar_andando', 0)
                .setScale(2.5)
                .setScrollFactor(0)
                .setDepth(301);

            spriteFornalha = this.add.sprite(larguraTela / 2 + 200, alturaTela / 2 - 10, 'Fornalha')
                .setScale(2.5)
                .setScrollFactor(0)
                .setDepth(301);
        }

        // Nomes sob os sprites
        this.add.text(larguraTela / 2 - 200, alturaTela / 2 + 55, "SOLAR", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(larguraTela / 2 + 200, alturaTela / 2 + 55, "FORNALHA", {
            fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: "#ff9900", fontStyle: "bold"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // 3. Exibição inicial do placar antigo
        const textoPlacar = this.add.text(larguraTela / 2, alturaTela / 2 - 10, `${this.pontosAntigosSolar} x ${this.pontosAntigosFornalha}`, {
            fontFamily: "'Courier New', Courier, monospace", 
            fontSize: 48, 
            color: "#ffff00", 
            stroke: "#000000", 
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

        // 4. Animação do placar atualizando após 1 segundo
        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: textoPlacar,
                scale: { from: 1, to: 1.25 },
                duration: 200,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });

            textoPlacar.setText(`${this.pontosNovosSolar} x ${this.pontosNovosFornalha}`);
            textoPlacar.setColor("#00ff00");
        });

        // 5. Transição para a próxima fase preservando o personagem local
        this.time.delayedCall(3500, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(this.proximaCena, {
                    personagem: this.game.meuPersonagem || this.personagemInicial,
                    pontosSolar: this.pontosNovosSolar,
                    pontosFornalha: this.pontosNovosFornalha
                });
            });
        });
    }
}
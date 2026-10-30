const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Serve a pasta 'dist' (build do Parcel/Vite) ou a raiz se testar direto
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Gera uma semente unificada baseada na data atual do servidor
const dataSimulada = new Date();
const sementeDia = dataSimulada.getFullYear() * 10000 + (dataSimulada.getMonth() + 1) * 100 + dataSimulada.getDate();

let estadoJogo = {
    personagensEscolhidos: {
        solar: null,    // Vai guardar o socket.id exato do Jogador Solar
        fornalha: null  // Vai guardar o socket.id exato do Jogador Fornalha
    },
    posicoes: {
        solar: { x: 100, y: 300 },
        fornalha: { x: 130, y: 300 }
    }
};

io.on('connection', (socket) => {
    console.log(`🎮 Jogador conectado: ${socket.id}`);

    socket.emit('estadoPersonagens', estadoJogo.personagensEscolhidos);
    socket.emit('inicializarMapa', { semente: estadoJogo.semente });

    socket.on('selecionarPersonagem', (personagem) => {
        if (personagem !== 'solar' && personagem !== 'fornalha') return;

        if (estadoJogo.personagensEscolhidos[personagem] && estadoJogo.personagensEscolhidos[personagem] !== socket.id) {
            socket.emit('erroSelecao', { mensagem: 'Personagem já escolhido!' });
            return;
        }

        const outro = personagem === 'solar' ? 'fornalha' : 'solar';
        if (estadoJogo.personagensEscolhidos[outro] === socket.id) {
            estadoJogo.personagensEscolhidos[outro] = null;
        }

        estadoJogo.personagensEscolhidos[personagem] = socket.id;
        io.emit('estadoPersonagens', estadoJogo.personagensEscolhidos);
    });

    socket.on('enviarPosicao', (data) => {
        let tipoPersonagem = null;
        if (estadoJogo.personagensEscolhidos.solar === socket.id) tipoPersonagem = 'solar';
        if (estadoJogo.personagensEscolhidos.fornalha === socket.id) tipoPersonagem = 'fornalha';

        if (tipoPersonagem) {
            // Agora salvamos também a cena e se o jogador já passou da tela de controles!
            estadoJogo.posicoes[tipoPersonagem] = { 
                x: data.x, 
                y: data.y,
                cena: data.cena,
                pronto: data.pronto
            };
            io.emit('atualizarPosicoes', estadoJogo.posicoes);
        } else {
            console.log(`⚠️ ATENÇÃO: Socket ${socket.id} tentou enviar posição mas não está associado a nenhum personagem!`);
        }
    });

    socket.on('faseConcluida', (dados) => {
        socket.broadcast.emit('irParaTransicao', dados);
    });

    socket.on('faseDiarioConcluida', () => {
        io.emit('voltarAoMenuGeral');
    });

    socket.on('liberarPersonagem', () => {
        liberarJogador(socket.id);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Jogador desconectado: ${socket.id}`);
        liberarJogador(socket.id);
    });
});

function liberarJogador(socketId) {
    let mudou = false;
    if (estadoJogo.personagensEscolhidos.solar === socketId) {
        estadoJogo.personagensEscolhidos.solar = null;
        mudou = true;
    }
    if (estadoJogo.personagensEscolhidos.fornalha === socketId) {
        estadoJogo.personagensEscolhidos.fornalha = null;
        mudou = true;
    }
    if (mudou) {
        io.emit('estadoPersonagens', estadoJogo.personagensEscolhidos);
    }
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

const PORT = 3000;
server.listen(PORT, '::', () => {
    const ip = getLocalIP();
    console.log(`\n==================================================`);
    console.log(`🔥 HEATCORE SERVER ONLINE NA FEIRA! 🔥`);
    console.log(`--------------------------------------------------`);
    console.log(`💻 No computador principal: http://localhost:${PORT}`);
    console.log(`📱 No celular/outros PCs no Wi-Fi: http://${ip}:${PORT}`);
    console.log(`==================================================\n`);
});
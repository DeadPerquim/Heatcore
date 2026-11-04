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

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Gera uma semente unificada baseada na data atual do servidor
const dataSimulada = new Date();
const sementeDia = dataSimulada.getFullYear() * 10000 + (dataSimulada.getMonth() + 1) * 100 + dataSimulada.getDate();

// Armazena as salas ativas. Chave: ID da sala, Valor: Dados da sala
const salas = {};

function gerarCodigoSala() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
    console.log(`🎮 Jogador conectado: ${socket.id}`);
    
    // Envia a semente do mapa diário assim que conecta
    socket.emit('inicializarMapa', { semente: sementeDia });

    // O jogador guarda a qual sala pertence
    socket.salaAtual = null;

    // ==========================================
    // SISTEMA DE LOBBY / SALAS
    // ==========================================
    
    socket.on('criarSala', (config) => {
        // config = { isPrivate, modo, mapaId, horarioTipo, hostNick, hostPersonagem }
        const salaId = config.isSingleplayer ? `SP_${socket.id}` : gerarCodigoSala();
        
        salas[salaId] = {
            id: salaId,
            isPrivate: config.isPrivate || config.isSingleplayer,
            isSingleplayer: config.isSingleplayer,
            modo: config.modo, // 'HISTORIA', 'ESPECIFICO', 'HORARIO'
            mapaId: config.mapaId,
            horarioTipo: config.horarioTipo,
            hostId: socket.id,
            jogadores: {
                [socket.id]: { nick: config.hostNick, personagem: config.hostPersonagem, pronto: true }
            },
            estado: 'LOBBY', // 'LOBBY' ou 'JOGANDO'
            posicoes: { 
                solar: { x: 0, y: 0, cena: null, pronto: false }, 
                fornalha: { x: 0, y: 0, cena: null, pronto: false } 
            }
        };

        socket.join(salaId);
        socket.salaAtual = salaId;
        
        socket.emit('salaCriada', salas[salaId]);
        io.emit('listaSalasAtualizada', obterSalasPublicas());
    });

    socket.on('solicitarSalasPublicas', () => {
        socket.emit('listaSalasAtualizada', obterSalasPublicas());
    });

    socket.on('entrarSala', (dados) => {
        const { salaId, nick } = dados;
        const sala = salas[salaId];

        if (!sala) {
            socket.emit('erroLobby', 'A sessão não foi encontrada ou não existe mais.');
            return;
        }
        if (sala.estado !== 'LOBBY') {
            socket.emit('erroLobby', 'Acesso negado: Partida já está em andamento.');
            return;
        }
        if (Object.keys(sala.jogadores).length >= 2) {
            socket.emit('erroLobby', 'Acesso negado: A sala está cheia (Máx. 2 Operadores).');
            return;
        }

        // Descobre qual personagem sobrou e aloca automaticamente o visitante
        const hostCor = sala.jogadores[sala.hostId].personagem;
        const personagemDisponivel = hostCor === 'solar' ? 'fornalha' : 'solar';

        sala.jogadores[socket.id] = { nick: nick, personagem: personagemDisponivel, pronto: true };
        
        socket.join(salaId);
        socket.salaAtual = salaId;

        // Atualiza a tela de Lobby para todos que estão nela (Host e Convidado)
        io.to(salaId).emit('atualizacaoLobby', sala);
        
        // Atualiza o Browser público
        io.emit('listaSalasAtualizada', obterSalasPublicas());
    });

    socket.on('iniciarPartida', () => {
        const salaId = socket.salaAtual;
        if (salaId && salas[salaId] && salas[salaId].hostId === socket.id) {
            
            // Trava de segurança no Back-end garantindo 2 jogadores
            if (!salas[salaId].isSingleplayer && Object.keys(salas[salaId].jogadores).length < 2) {
                socket.emit('erroLobby', 'Não é possível iniciar a partida sem um segundo operador.');
                return;
            }

            salas[salaId].estado = 'JOGANDO';
            io.to(salaId).emit('partidaIniciada', salas[salaId]);
            io.emit('listaSalasAtualizada', obterSalasPublicas());
        }
    });

    socket.on('sairDaSala', () => {
        removerJogadorDaSala(socket);
    });

    // ==========================================
    // IN-GAME NETWORK
    // ==========================================

    socket.on('enviarPosicao', (data) => {
        const salaId = socket.salaAtual;
        if (!salaId || !salas[salaId]) return;

        const jogador = salas[salaId].jogadores[socket.id];
        if (jogador) {
            salas[salaId].posicoes[jogador.personagem] = { 
                x: data.x, 
                y: data.y, 
                cena: data.cena,
                pronto: data.pronto 
            };
            io.to(salaId).emit('atualizarPosicoes', salas[salaId].posicoes);
        }
    });

    socket.on('faseConcluida', (dados) => {
        if (socket.salaAtual) {
            socket.to(socket.salaAtual).emit('irParaTransicao', dados);
        }
    });

    socket.on('faseDiarioConcluida', () => {
        if (socket.salaAtual) io.to(socket.salaAtual).emit('voltarAoMenuGeral');
    });

    socket.on('disconnect', () => {
        console.log(`❌ Jogador desconectado: ${socket.id}`);
        removerJogadorDaSala(socket);
    });
});

function obterSalasPublicas() {
    return Object.values(salas)
        .filter(s => !s.isPrivate && !s.isSingleplayer && s.estado === 'LOBBY' && Object.keys(s.jogadores).length < 2)
        .map(s => ({
            id: s.id,
            hostNick: s.jogadores[s.hostId].nick,
            modo: s.modo,
            mapaId: s.mapaId
        }));
}

function removerJogadorDaSala(socket) {
    const salaId = socket.salaAtual;
    if (!salaId || !salas[salaId]) return;

    const sala = salas[salaId];
    delete sala.jogadores[socket.id];
    socket.leave(salaId);
    socket.salaAtual = null;

    if (Object.keys(sala.jogadores).length === 0) {
        delete salas[salaId]; // Destrói a sala vazia se todos saírem
    } else {
        // Se o host original saiu, o convidado assume como host
        if (sala.hostId === socket.id) {
            sala.hostId = Object.keys(sala.jogadores)[0];
        }
        io.to(salaId).emit('atualizacaoLobby', sala);
        io.to(salaId).emit('erroLobby', 'O outro operador se desconectou da rede.');
    }
    io.emit('listaSalasAtualizada', obterSalasPublicas());
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
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
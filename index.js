const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Configuración de middleware
app.use(express.static(path.join(__dirname, 'src/public')));
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Estado global del juego
const gameRooms = new Map();
const waitingPlayers = new Map();

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// Manejo de Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('join_game', (playerName) => {
        console.log(`${playerName} quiere unirse al juego`);
        
        const player = {
            id: socket.id,
            name: playerName,
            socket: socket
        };

        // Buscar oponente disponible
        const opponent = findOpponent(player);
        if (opponent) {
            // Crear nueva partida
            createGame(player, opponent);
        } else {
            // Añadir a la cola de espera
            waitingPlayers.set(socket.id, player);
            socket.emit('waiting_for_opponent');
        }
    });

    socket.on('player_input', (data) => {
        const game = findGameByPlayerId(socket.id);
        if (game) {
            updateGameState(game, socket.id, data.input);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        handlePlayerDisconnect(socket.id);
    });
});

function findOpponent(player) {
    for (const [id, waitingPlayer] of waitingPlayers) {
        if (id !== player.id) {
            waitingPlayers.delete(id);
            return waitingPlayer;
        }
    }
    return null;
}

function createGame(player1, player2) {
    const gameId = `game_${Date.now()}`;
    const game = {
        id: gameId,
        players: {
            left: player1,
            right: player2
        },
        state: initializeGameState(),
        interval: null
    };

    // Unir jugadores a la sala
    player1.socket.join(gameId);
    player2.socket.join(gameId);

    // Notificar inicio de juego
    player1.socket.emit('game_start', {
        gameId: gameId,
        side: 'left',
        teams: { left: player1.name, right: player2.name }
    });

    player2.socket.emit('game_start', {
        gameId: gameId,
        side: 'right',
        teams: { left: player1.name, right: player2.name }
    });

    // Iniciar bucle del juego
    game.interval = setInterval(() => {
        updateGame(game);
    }, 1000 / 60);

    gameRooms.set(gameId, game);
}

function initializeGameState() {
    return {
        ball: {
            x: CONSTANTS.FIELD.WIDTH / 2,
            y: CONSTANTS.FIELD.HEIGHT / 2,
            vx: 0,
            vy: 0,
            radius: CONSTANTS.BALL.RADIUS
        },
        players: {},
        score: { left: 0, right: 0 },
        timer: {
            time: CONSTANTS.GAME.DURATION,
            formatted: "2:00"
        }
    };
}

function updateGameState(game, playerId, input) {
    if (!game.state.players[playerId]) {
        game.state.players[playerId] = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: CONSTANTS.PLAYER.RADIUS
        };
    }

    const player = game.state.players[playerId];
    player.vx = input.x * CONSTANTS.PLAYER.SPEED;
    player.vy = input.y * CONSTANTS.PLAYER.SPEED;
}

function updateGame(game) {
    // Actualizar posiciones
    updatePositions(game);

    // Verificar colisiones
    checkCollisions(game);

    // Verificar goles
    checkGoals(game);

    // Actualizar timer
    updateTimer(game);

    // Emitir estado actualizado
    io.to(game.id).emit('game_state', game.state);
}

function handlePlayerDisconnect(playerId) {
    // Remover de la cola de espera
    waitingPlayers.delete(playerId);

    // Buscar y terminar juego activo
    for (const [gameId, game] of gameRooms) {
        if (game.players.left.id === playerId || game.players.right.id === playerId) {
            endGame(game, 'disconnect');
            break;
        }
    }
}

function endGame(game, reason) {
    clearInterval(game.interval);
    
    if (reason === 'disconnect') {
        io.to(game.id).emit('opponent_disconnected');
    } else {
        const winner = game.state.score.left > game.state.score.right ? 'left' : 'right';
        io.to(game.id).emit('game_over', {
            winner,
            score: game.state.score
        });
    }

    gameRooms.delete(game.id);
}

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal!');
});

// Puerto para Vercel
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});

module.exports = app;

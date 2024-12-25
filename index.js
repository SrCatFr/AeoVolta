const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Importar clases del juego
const CONSTANTS = require('./src/shared/constants');
const Ball = require('./src/game/Ball');
const Player = require('./src/game/Player');
const Field = require('./src/game/Field');
const Score = require('./src/game/Score');
const Timer = require('./src/game/Timer');
const Physics = require('./src/game/Physics');

// Configuración de Express
// En index.js, después de la configuración de express.static
app.use('/shared', express.static(path.join(__dirname, 'src/shared')));

app.use(express.static(path.join(__dirname, 'src/public')));
// Al inicio del archivo, después de las importaciones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Añade manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// Añade una ruta de prueba
app.get('/test', (req, res) => {
    res.json({ status: 'ok' });
});


// Gestión de juegos activos
const activeGames = new Map();
const waitingPlayers = [];

class Game {
    constructor(player1, player2) {
        this.id = `game_${Date.now()}`;
        this.field = new Field();
        this.ball = new Ball();
        this.score = new Score();
        this.timer = new Timer(120); // 2 minutos

        this.players = {
            [player1.id]: new Player(player1.id, player1.name, 'left'),
            [player2.id]: new Player(player2.id, player2.name, 'right')
        };

        this.timer.start();
        this.gameLoop = null;
    }

    start() {
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    }

    update() {
        // Actualizar estado del juego
        if (this.timer.isTimeUp()) {
            this.end();
            return;
        }

        // Actualizar posiciones
        Object.values(this.players).forEach(player => {
            player.update(player.input || { x: 0, y: 0 });
        });
        this.ball.update();

        // Comprobar colisiones
        this.checkCollisions();

        // Comprobar goles
        const goalSide = this.field.checkGoal(this.ball);
        if (goalSide) {
            this.score.addGoal(goalSide);
            this.ball.reset();
            Object.values(this.players).forEach(player => player.reset());
        }

        // Emitir estado actualizado
        this.emitGameState();
    }

    checkCollisions() {
        // Colisiones jugador-pelota
        Object.values(this.players).forEach(player => {
            if (Physics.checkCollision(player, this.ball)) {
                Physics.resolveCollision(player, this.ball);
            }
        });

        // Colisiones con paredes
        this.field.checkWallCollision(this.ball);
        Object.values(this.players).forEach(player => {
            this.field.checkWallCollision(player);
        });
    }

    emitGameState() {
        const gameState = {
            ball: this.ball.getState(),
            players: Object.values(this.players).map(p => p.getState()),
            score: this.score.getState(),
            timer: this.timer.getState()
        };

        io.to(this.id).emit('game_state', gameState);
    }

    end() {
        clearInterval(this.gameLoop);
        const result = {
            winner: this.score.getWinner(),
            score: this.score.getState(),
            players: Object.values(this.players).map(p => ({
                id: p.id,
                name: p.name,
                side: p.side
            }))
        };
        io.to(this.id).emit('game_over', result);
        activeGames.delete(this.id);
    }

    handlePlayerInput(playerId, input) {
        if (this.players[playerId]) {
            this.players[playerId].input = input;
        }
    }
}

// Configuración de Socket.IO
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('join_game', (playerName) => {
        console.log(`Player ${playerName} (${socket.id}) wants to join a game`);

        const playerData = {
            id: socket.id,
            name: playerName,
            socket: socket
        };

        if (waitingPlayers.length > 0) {
            console.log('Found opponent, creating game...');
            const opponent = waitingPlayers.pop();
            const game = new Game(opponent, playerData);

            console.log(`Game created: ${game.id}`);

            opponent.socket.join(game.id);
            socket.join(game.id);

            activeGames.set(game.id, game);

            console.log('Notifying players...');
            opponent.socket.emit('game_start', {
                gameId: game.id,
                side: 'left',
                opponent: playerName
            });
            socket.emit('game_start', {
                gameId: game.id,
                side: 'right',
                opponent: opponent.name
            });

            game.start();
            console.log('Game started');
        } else {
            console.log(`Player ${playerName} added to waiting list`);
            waitingPlayers.push(playerData);
            socket.emit('waiting_for_opponent');
        }
    });

    socket.on('player_input', (data) => {
        const game = Array.from(activeGames.values())
            .find(g => g.players[socket.id]);

        if (game) {
            game.handlePlayerInput(socket.id, data.input);
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        // Remover de la lista de espera
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Terminar juego activo si está en uno
        const game = Array.from(activeGames.values())
            .find(g => g.players[socket.id]);

        if (game) {
            // Notificar al otro jugador
            Object.values(game.players).forEach(player => {
                if (player.id !== socket.id) {
                    io.to(player.id).emit('opponent_disconnected');
                }
            });
            game.end();
        }
    });
});

// Manejo de errores
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

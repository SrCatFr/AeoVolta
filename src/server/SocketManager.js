class SocketManager {
    constructor(io, matchMaking) {
        this.io = io;
        this.matchMaking = matchMaking;

        io.on('connection', (socket) => {
            console.log('Player connected:', socket.id);

            socket.on('join_game', (playerName) => {
                const player = {
                    id: socket.id,
                    name: playerName
                };

                const result = this.matchMaking.addPlayer(player);
                
                if (result.matched) {
                    // Notificar a ambos jugadores que el juego comienza
                    io.to(result.game.player1.id).emit('game_start', {
                        opponent: result.game.player2.name
                    });
                    io.to(result.game.player2.id).emit('game_start', {
                        opponent: result.game.player1.name
                    });
                } else {
                    socket.emit('waiting_for_opponent');
                }
            });

            socket.on('player_move', (data) => {
                // Actualizar posición del jugador y emitir a los oponentes
                const game = this.matchMaking.getGameByPlayerId(socket.id);
                if (game) {
                    game.updatePlayerPosition(socket.id, data.position);
                    socket.broadcast.to(game.id).emit('opponent_moved', data);
                }
            });

            socket.on('disconnect', () => {
                this.matchMaking.removePlayer(socket.id);
                console.log('Player disconnected:', socket.id);
            });
        });
    }
}

module.exports = SocketManager;

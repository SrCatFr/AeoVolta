class MatchMaking {
    constructor() {
        this.waitingPlayers = [];
        this.activeGames = new Map();
    }

    addPlayer(player) {
        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift();
            const game = new Game(opponent, player);
            this.activeGames.set(game.id, game);
            return { matched: true, game };
        } else {
            this.waitingPlayers.push(player);
            return { matched: false };
        }
    }

    removePlayer(playerId) {
        this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== playerId);
        // También manejar si el jugador está en un juego activo
    }
}

module.exports = MatchMaking;

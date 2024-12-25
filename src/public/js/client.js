class AeoVoltaClient {
    constructor() {
        this.socket = io();
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.joystick = new Joystick(document.getElementById('joystick-area'));
        
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value;
            if (playerName.trim()) {
                this.startGame(playerName);
            }
        });
    }

    setupSocketListeners() {
        this.socket.on('waiting_for_opponent', () => {
            // Mostrar pantalla de espera
        });

        this.socket.on('game_start', (data) => {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            this.startGameLoop();
        });

        this.socket.on('game_update', (gameState) => {
            this.updateGame(gameState);
        });

        this.socket.on('game_over', (result) => {
            this.showGameOver(result);
        });
    }

    startGame(playerName) {
        this.socket.emit('join_game', playerName);
    }

    startGameLoop() {
        setInterval(() => {
            const position = this.joystick.getPosition();
            this.socket.emit('player_move', { position });
        }, 1000 / 60);
    }

    updateGame(gameState) {
        // Actualizar el canvas con el nuevo estado del juego
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Dibujar jugadores, pelota y campo
    }

    showGameOver(result) {
        // Mostrar pantalla de fin de juego
    }
}

// Iniciar el cliente cuando la página cargue
window.onload = () => {
    new AeoVoltaClient();
};

class Game {
    constructor() {
        console.log('Inicializando juego...');

        // Inicializar Socket.IO
        this.socket = io({
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        // Elementos del juego
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.controls = new Controls(document.getElementById('joystick-area'));
        this.audioManager = new AudioManager();

        // Referencias DOM
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.startBtn = document.getElementById('start-btn');
        this.playerNameInput = document.getElementById('player-name');
        this.gameMessages = document.getElementById('game-messages');
        this.messageContent = document.querySelector('#game-messages .message-content');

        // Estado del juego
        this.gameState = {
            players: {},
            ball: {
                x: CONSTANTS.FIELD.WIDTH / 2,
                y: CONSTANTS.FIELD.HEIGHT / 2,
                radius: CONSTANTS.BALL.RADIUS
            },
            score: { left: 0, right: 0 },
            timer: { formatted: "2:00" }
        };

        // Variables de control
        this.gameId = null;
        this.playerSide = null;
        this.isPlaying = false;
        this.isConnected = false;
        this.lastUpdateTime = 0;
        this.rendererReady = false;

        // Inicialización
        this.setupSocketEvents();
        this.setupInputHandlers();
        this.initializeRenderer();

        console.log('Juego inicializado');
    }

    initializeRenderer() {
        if (this.renderer) {
            setTimeout(() => {
                this.renderer.resize();
                this.rendererReady = true;
                console.log('Renderer inicializado');
            }, 100);
        }
    }

    setupInputHandlers() {
        console.log('Configurando controles...');

        if (this.startBtn && this.playerNameInput) {
            this.startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const playerName = this.playerNameInput.value.trim();
                if (playerName) {
                    console.log('Iniciando juego con nombre:', playerName);
                    this.joinGame(playerName);
                }
            });

            this.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const playerName = this.playerNameInput.value.trim();
                    if (playerName) {
                        this.joinGame(playerName);
                    }
                }
            });
        }
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Conectado al servidor');
            this.isConnected = true;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
            this.handleConnectionError();
        });

        this.socket.on('waiting_for_opponent', () => {
            console.log('Esperando oponente...');
            this.transitionToGame();
            this.showMessage('Esperando oponente...', true);
        });

        this.socket.on('game_start', (data) => {
            console.log('Iniciando partida:', data);
            this.hideMessage();
            this.setupGame(data);
        });

        this.socket.on('game_state', (state) => {
            this.updateGameState(state);
        });

        this.socket.on('opponent_disconnected', () => {
            console.log('Oponente desconectado');
            this.showMessage('Oponente desconectado', false);
            setTimeout(() => location.reload(), 2000);
        });

        this.socket.on('game_over', (result) => {
            this.handleGameOver(result);
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
            this.handleDisconnect();
        });
    }

    joinGame(playerName) {
        if (this.startBtn) {
            this.startBtn.disabled = true;
            this.startBtn.textContent = 'Conectando...';
        }

        console.log('Emitiendo join_game');
        this.socket.emit('join_game', playerName);
    }

    handleConnectionError() {
        if (this.startBtn) {
            this.startBtn.disabled = false;
            this.startBtn.textContent = 'JUGAR AHORA';
        }
        this.showMessage('Error de conexión. Intenta de nuevo.', true);
    }

    transitionToGame() {
        console.log('Transicionando a pantalla de juego');
        if (this.startScreen && this.gameScreen) {
            this.startScreen.style.display = 'none';
            this.gameScreen.style.display = 'block';

            setTimeout(() => {
                if (this.renderer) {
                    this.renderer.resize();
                }
            }, 100);
        }
    }

    setupGame(data) {
        this.gameId = data.gameId;
        this.playerSide = data.side;
        this.isPlaying = true;

        // Actualizar nombres de equipos
        if (data.teams) {
            const teamLeft = document.getElementById('team-left');
            const teamRight = document.getElementById('team-right');
            if (teamLeft) teamLeft.textContent = data.teams.left;
            if (teamRight) teamRight.textContent = data.teams.right;
        }

        this.showCountdown(() => {
            this.audioManager.playWhistle();
            this.startGameLoop();
        });
    }

    updateGameState(state) {
        if (!state) return;
        this.gameState = state;

        // Actualizar UI
        const scoreLeft = document.getElementById('score-left');
        const scoreRight = document.getElementById('score-right');
        const gameTimer = document.getElementById('game-timer');

        if (scoreLeft && state.score) scoreLeft.textContent = state.score.left;
        if (scoreRight && state.score) scoreRight.textContent = state.score.right;
        if (gameTimer && state.timer) gameTimer.textContent = state.timer.formatted;
    }

    startGameLoop() {
        console.log('Iniciando game loop');
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isPlaying) return;

        const now = performance.now();
        this.lastUpdateTime = now;

        if (this.controls) {
            const input = this.controls.getInput();
            if (this.gameId) {
                this.socket.emit('player_input', {
                    gameId: this.gameId,
                    input: input
                });
            }
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        if (!this.renderer || !this.rendererReady) return;

        this.renderer.clear();
        this.renderer.drawField();

        // Dibujar jugadores
        if (this.gameState.players) {
            Object.values(this.gameState.players).forEach(player => {
                const color = player.side === 'left' ? 
                    CONSTANTS.COLORS.PLAYER1 : 
                    CONSTANTS.COLORS.PLAYER2;
                this.renderer.drawPlayer(player, color);
            });
        }

        // Dibujar pelota
        if (this.gameState.ball) {
            this.renderer.drawBall(this.gameState.ball);
        }
    }

    showMessage(message, isTemporary = false) {
        if (this.gameMessages && this.messageContent) {
            this.messageContent.textContent = message;
            this.gameMessages.classList.remove('hidden');
            
            if (isTemporary) {
                setTimeout(() => this.hideMessage(), 3000);
            }
        }
    }

    hideMessage() {
        if (this.gameMessages) {
            this.gameMessages.classList.add('hidden');
        }
    }

    showCountdown(callback) {
        let count = 3;
        const countdownEl = document.createElement('div');
        countdownEl.className = 'countdown';
        document.body.appendChild(countdownEl);

        const countInterval = setInterval(() => {
            if (count > 0) {
                countdownEl.textContent = count;
                count--;
            } else {
                clearInterval(countInterval);
                countdownEl.remove();
                if (callback) callback();
            }
        }, 1000);
    }

    handleGameOver(result) {
        this.isPlaying = false;
        const message = `
            ¡Juego terminado!
            ${result.winner === this.playerSide ? '¡Has ganado!' : '¡Has perdido!'}
            ${result.score.left} - ${result.score.right}
        `;
        
        this.showMessage(message);
        setTimeout(() => location.reload(), 3000);
    }

    handleDisconnect() {
        this.isPlaying = false;
        this.isConnected = false;
        this.showMessage('Desconectado del servidor. Reconectando...', true);
        
        setTimeout(() => {
            if (!this.isConnected) {
                location.reload();
            }
        }, 5000);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, iniciando juego');
    window.gameInstance = new Game();
});

class Game {
    constructor() {
        // Configuración de Socket.IO para Vercel
        this.socket = io({
            transports: ['websocket'],
            upgrade: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            autoConnect: true
        });

        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.controls = new Controls(document.getElementById('joystick-area'));
        this.audioManager = new AudioManager();
        
        // Referencias DOM
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.scoreLeft = document.getElementById('score-left');
        this.scoreRight = document.getElementById('score-right');
        this.gameTimer = document.getElementById('game-timer');
        this.gamePeriod = document.getElementById('game-period');
        this.gameMessages = document.getElementById('game-messages');
        this.messageContent = document.querySelector('#game-messages .message-content');
        
        // Estado del juego
        this.gameState = {
            players: {},
            ball: { 
                x: CONSTANTS.FIELD.WIDTH/2, 
                y: CONSTANTS.FIELD.HEIGHT/2,
                radius: CONSTANTS.BALL.RADIUS
            },
            score: { left: 0, right: 0 },
            timer: { formatted: "2:00" }
        };
        
        this.gameId = null;
        this.playerSide = null;
        this.isPlaying = false;
        this.isConnected = false;
        this.lastUpdateTime = 0;
        this.rendererReady = false;

        this.setupSocketEvents();
        this.setupInputHandlers();
        this.initializeRenderer();
    }

    initializeRenderer() {
        if (this.renderer) {
            setTimeout(() => {
                this.renderer.resize();
                this.rendererReady = true;
            }, 100);
        }
    }

    setupInputHandlers() {
        const startBtn = document.getElementById('start-btn');
        const playerNameInput = document.getElementById('player-name');

        if (startBtn && playerNameInput) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (playerNameInput.value.trim()) {
                    this.attemptJoinGame(playerNameInput.value);
                }
            });

            playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && playerNameInput.value.trim()) {
                    e.preventDefault();
                    this.attemptJoinGame(playerNameInput.value);
                }
            });
        }
    }

    attemptJoinGame(playerName) {
        if (!this.socket.connected) {
            this.showMessage('Esperando conexión...', true);
            this.socket.connect();
            
            this.socket.once('connect', () => {
                this.emitJoinGame(playerName);
            });
            return;
        }

        this.emitJoinGame(playerName);
    }

    emitJoinGame(playerName) {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = 'Conectando...';
        }
        
        this.socket.emit('join_game', playerName);
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
            this.transitionToGame();
            this.showMessage('Esperando oponente...', true);
        });

        this.socket.on('game_start', (data) => {
            if (data) {
                this.hideMessage();
                this.setupGame(data);
            }
        });

        this.socket.on('game_state', (state) => {
            if (state) {
                this.updateGameState(state);
            }
        });

        this.socket.on('opponent_disconnected', () => {
            this.showMessage('Oponente desconectado', false);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        });

        this.socket.on('game_over', (result) => {
            this.handleGameOver(result);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Desconectado:', reason);
            this.handleDisconnect(reason);
        });
    }

    handleConnectionError() {
        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        
        this.showMessage('Error de conexión. Reintentando...', true);
        
        this.errorTimeout = setTimeout(() => {
            if (!this.socket.connected) {
                this.showMessage('No se pudo conectar al servidor. ¿Deseas reintentar?', false);
                this.showRetryButton();
            }
        }, 5000);
    }

    showRetryButton() {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'neon-btn';
        retryBtn.textContent = 'Reintentar conexión';
        retryBtn.onclick = () => {
            this.socket.connect();
            retryBtn.remove();
        };
        
        if (this.messageContent) {
            this.messageContent.appendChild(retryBtn);
        }
    }

    transitionToGame() {
        if (this.startScreen && this.gameScreen) {
            this.startScreen.style.display = 'none';
            this.gameScreen.style.display = 'block';
            
            if (this.renderer) {
                setTimeout(() => {
                    this.renderer.resize();
                }, 100);
            }
        }
    }

    setupGame(data) {
        this.gameId = data.gameId;
        this.playerSide = data.side;
        this.isPlaying = true;

        if (data.teams) {
            const teamLeft = document.getElementById('team-left');
            const teamRight = document.getElementById('team-right');
            if (teamLeft) teamLeft.textContent = data.teams.left;
            if (teamRight) teamRight.textContent = data.teams.right;
        }

        this.transitionToGame();
        this.showCountdown(() => {
            this.audioManager.playWhistle();
            this.startGameLoop();
        });
    }

    showCountdown(callback) {
        let count = 3;
        const countdownEl = document.createElement('div');
        countdownEl.className = 'countdown';
        document.body.appendChild(countdownEl);

        const countInterval = setInterval(() => {
            if (count > 0) {
                countdownEl.textContent = count.toString();
                count--;
            } else {
                clearInterval(countInterval);
                countdownEl.remove();
                if (callback) callback();
            }
        }, 1000);
    }

    updateGameState(state) {
        this.gameState = state;
        
        if (this.scoreLeft && state.score) {
            this.scoreLeft.textContent = state.score.left.toString();
        }
        if (this.scoreRight && state.score) {
            this.scoreRight.textContent = state.score.right.toString();
        }
        if (this.gameTimer && state.timer) {
            this.gameTimer.textContent = state.timer.formatted;
        }
    }

    startGameLoop() {
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const delta = now - this.lastUpdateTime;
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

        if (this.gameState.players) {
            Object.values(this.gameState.players).forEach(player => {
                if (player && player.side) {
                    const color = player.side === 'left' ? 
                        CONSTANTS.COLORS.PLAYER1 : 
                        CONSTANTS.COLORS.PLAYER2;
                    this.renderer.drawPlayer(player, color);
                }
            });
        }

        if (this.gameState.ball) {
            this.renderer.drawBall(this.gameState.ball);
        }
    }

    showMessage(message, isTemporary = false) {
        if (this.messageContent && this.gameMessages) {
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

    handleGameOver(result) {
        this.isPlaying = false;
        if (!result) return;

        const message = `
            ¡Juego terminado!
            ${result.winner === this.playerSide ? '¡Has ganado!' : '¡Has perdido!'}
            ${result.score ? `${result.score.left} - ${result.score.right}` : ''}
        `;
        
        this.showMessage(message);
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    handleDisconnect(reason) {
        this.isPlaying = false;
        this.isConnected = false;
        this.showMessage('Desconectado del servidor. Reconectando...', true);
        
        setTimeout(() => {
            if (!this.isConnected) {
                window.location.reload();
            }
        }, 5000);
    }
}

// Inicialización del juego
window.onload = () => {
    console.log('Iniciando juego...');
    new Game();
};

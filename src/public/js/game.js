class Game {
  constructor() {
      console.log('Iniciando juego...'); // Debug
      this.socket = io();
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
      console.log('Inicializando renderer...'); // Debug
      if (this.renderer) {
          setTimeout(() => {
              this.renderer.resize();
              this.rendererReady = true;
              console.log('Renderer inicializado'); // Debug
          }, 100);
      }
  }

  setupInputHandlers() {
      const startBtn = document.getElementById('start-btn');
      const playerNameInput = document.getElementById('player-name');

      if (startBtn && playerNameInput) {
          startBtn.addEventListener('click', () => {
              if (playerNameInput.value.trim()) {
                  this.attemptJoinGame(playerNameInput.value);
              }
          });

          playerNameInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter' && playerNameInput.value.trim()) {
                  this.attemptJoinGame(playerNameInput.value);
              }
          });
      }
  }

  attemptJoinGame(playerName) {
      console.log('Intentando unirse al juego como:', playerName); // Debug
      const startBtn = document.getElementById('start-btn');
      if (startBtn) {
          startBtn.disabled = true;
          startBtn.textContent = 'Conectando...';
      }
      if (this.socket && this.isConnected) {
          this.socket.emit('join_game', playerName);
      } else {
          console.error('Socket no disponible o no conectado');
          this.showMessage('Error de conexión. Intenta de nuevo.', true);
          if (startBtn) {
              startBtn.disabled = false;
              startBtn.textContent = 'JUGAR AHORA';
          }
      }
  }

  setupSocketEvents() {
      if (!this.socket) {
          console.error('Socket no inicializado');
          return;
      }

      this.socket.on('connect', () => {
          console.log('Conectado al servidor');
          this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
          console.log('Desconectado del servidor');
          this.isConnected = false;
          this.handleDisconnect();
      });

      this.socket.on('connect_error', (error) => {
          console.error('Error de conexión:', error);
          this.showMessage('Error de conexión', true);
      });

      this.socket.on('waiting_for_opponent', () => {
          console.log('Esperando oponente...');
          this.transitionToGame();
          this.showMessage('Esperando oponente...', true);
      });

      this.socket.on('game_start', (data) => {
          console.log('Juego iniciando:', data); // Debug
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
          setTimeout(() => location.reload(), 2000);
      });

      this.socket.on('game_over', (result) => {
          this.handleGameOver(result);
      });
  }

  transitionToGame() {
      console.log('Transicionando a pantalla de juego...'); // Debug
      if (this.startScreen && this.gameScreen) {
          this.startScreen.style.display = 'none';
          this.gameScreen.style.display = 'block';

          // Forzar actualización del renderer
          if (this.renderer) {
              setTimeout(() => {
                  this.renderer.resize();
                  console.log('Renderer actualizado después de transición'); // Debug
              }, 100);
          }
      }
  }

  setupGame(data) {
      console.log('Configurando juego:', data); // Debug
      if (!data) return;

      this.gameId = data.gameId;
      this.playerSide = data.side;
      this.isPlaying = true;

      // Actualizar UI
      if (data.teams) {
          const teamLeft = document.getElementById('team-left');
          const teamRight = document.getElementById('team-right');
          if (teamLeft) teamLeft.textContent = data.teams.left || 'EQUIPO A';
          if (teamRight) teamRight.textContent = data.teams.right || 'EQUIPO B';
      }

      this.transitionToGame();
      this.showCountdown(() => {
          this.audioManager.playWhistle();
          this.startGameLoop();
      });
  }

  updateGameState(state) {
      if (!state) return;

      this.gameState = state;

      // Actualizar UI
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
      console.log('Iniciando game loop...'); // Debug
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

      // Dibujar jugadores
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

      // Dibujar pelota
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

  handleGameOver(result) {
      this.isPlaying = false;
      if (!result) return;

      const message = `
          ¡Juego terminado!
          ${result.winner === this.playerSide ? '¡Has ganado!' : '¡Has perdido!'}
          ${result.score ? `${result.score.left} - ${result.score.right}` : ''}
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

// Inicialización del juego
window.onload = () => {
  console.log('Página cargada, iniciando juego...'); // Debug
  new Game();
};

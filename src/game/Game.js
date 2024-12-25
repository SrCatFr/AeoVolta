const Matter = require('matter-js');

class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.score = { p1: 0, p2: 0 };
        this.duration = 120000; // 2 minutos en ms
        this.startTime = Date.now();
        this.isFinished = false;

        // Configuración del motor físico
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Crear límites del campo
        this.createBoundaries();
        
        // Crear pelota
        this.ball = this.createBall();
        
        // Iniciar el bucle del juego
        this.gameLoop();
    }

    createBoundaries() {
        const walls = [
            Matter.Bodies.rectangle(400, 0, 800, 20, { isStatic: true }),   // Top
            Matter.Bodies.rectangle(400, 600, 800, 20, { isStatic: true }), // Bottom
            Matter.Bodies.rectangle(0, 300, 20, 600, { isStatic: true }),   // Left
            Matter.Bodies.rectangle(800, 300, 20, 600, { isStatic: true })  // Right
        ];
        Matter.World.add(this.world, walls);
    }

    createBall() {
        return Matter.Bodies.circle(400, 300, 10, {
            restitution: 0.8,
            friction: 0.005,
            density: 0.001
        });
    }

    updatePlayerPosition(playerId, position) {
        const player = playerId === this.player1.id ? this.player1 : this.player2;
        Matter.Body.setPosition(player.body, position);
    }

    gameLoop() {
        if (this.isFinished) return;

        Matter.Engine.update(this.engine, 1000 / 60);

        // Verificar si el tiempo se acabó
        if (Date.now() - this.startTime >= this.duration) {
            this.endGame();
        }

        // Programar siguiente frame
        setTimeout(() => this.gameLoop(), 1000 / 60);
    }

    endGame() {
        this.isFinished = true;
        const winner = this.score.p1 > this.score.p2 ? this.player1 : this.player2;
        return {
            winner: winner.id,
            finalScore: this.score
        };
    }
}

module.exports = Game;

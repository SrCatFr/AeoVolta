const CONSTANTS = require('../shared/constants');
const Physics = require('./Physics');

class Ball {
    constructor() {
        this.radius = CONSTANTS.BALL.RADIUS;
        this.mass = 0.8; // Masa reducida para más rebote
        this.reset();

        // Coeficientes de rebote
        this.RESTITUTION = 1.1;    // Coeficiente de restitución (>1 para más rebote)
        this.WALL_BOUNCE = 0.95;    // Mantiene más energía en rebotes con paredes
        this.MIN_SPEED = 0.5;      // Velocidad mínima para mantener el movimiento
        this.FRICTION = 0.995;     // Menor fricción para mantener el movimiento
    }

    reset() {
        this.x = CONSTANTS.FIELD.WIDTH / 2;
        this.y = CONSTANTS.FIELD.HEIGHT / 2;
        this.vx = (Math.random() - 0.5) * 5; // Velocidad inicial aleatoria
        this.vy = (Math.random() - 0.5) * 5;
    }

    update() {
        // Actualizar posición
        this.x += this.vx;
        this.y += this.vy;

        // Aplicar fricción reducida
        this.vx *= this.FRICTION;
        this.vy *= this.FRICTION;

        // Verificar colisiones con los límites del campo
        this.handleBoundaryCollisions();

        // Limitar la velocidad máxima
        this.limitSpeed();

        // Mantener un mínimo de velocidad para que la pelota siga moviéndose
        this.maintainMinimumSpeed();
    }

    handleBoundaryCollisions() {
        const goalY1 = (CONSTANTS.FIELD.HEIGHT - CONSTANTS.FIELD.GOAL_SIZE) / 2;
        const goalY2 = goalY1 + CONSTANTS.FIELD.GOAL_SIZE;

        // Colisión con paredes verticales (excluyendo las porterías)
        if (this.x - this.radius < 0) {
            if (this.y < goalY1 || this.y > goalY2) {
                this.x = this.radius;
                this.vx = -this.vx * this.WALL_BOUNCE;
                // Añadir velocidad aleatoria en Y para más dinamismo
                this.vy += (Math.random() - 0.5) * 2;
            }
        } else if (this.x + this.radius > CONSTANTS.FIELD.WIDTH) {
            if (this.y < goalY1 || this.y > goalY2) {
                this.x = CONSTANTS.FIELD.WIDTH - this.radius;
                this.vx = -this.vx * this.WALL_BOUNCE;
                // Añadir velocidad aleatoria en Y para más dinamismo
                this.vy += (Math.random() - 0.5) * 2;
            }
        }

        // Colisión con paredes horizontales
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy * this.WALL_BOUNCE;
            // Añadir velocidad aleatoria en X para más dinamismo
            this.vx += (Math.random() - 0.5) * 2;
        } else if (this.y + this.radius > CONSTANTS.FIELD.HEIGHT) {
            this.y = CONSTANTS.FIELD.HEIGHT - this.radius;
            this.vy = -this.vy * this.WALL_BOUNCE;
            // Añadir velocidad aleatoria en X para más dinamismo
            this.vx += (Math.random() - 0.5) * 2;
        }

        // Prevenir que la pelota se quede atascada
        this.handleCornerStuck();
    }

    handleCornerStuck() {
        const cornerThreshold = this.radius * 2;
        const boostSpeed = 3; // Velocidad de impulso al salir de las esquinas

        // Verificar si la pelota está cerca de una esquina
        if (this.x < cornerThreshold || this.x > CONSTANTS.FIELD.WIDTH - cornerThreshold) {
            if (this.y < cornerThreshold || this.y > CONSTANTS.FIELD.HEIGHT - cornerThreshold) {
                // Dar un impulso aleatorio para salir de la esquina
                this.vx = (Math.random() - 0.5) * boostSpeed;
                this.vy = (Math.random() - 0.5) * boostSpeed;

                // Asegurar una velocidad mínima en ambas direcciones
                if (Math.abs(this.vx) < 1) this.vx *= 2;
                if (Math.abs(this.vy) < 1) this.vy *= 2;
            }
        }
    }

    maintainMinimumSpeed() {
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        if (currentSpeed < this.MIN_SPEED && currentSpeed > 0) {
            const factor = this.MIN_SPEED / currentSpeed;
            this.vx *= factor;
            this.vy *= factor;
        }
    }

    limitSpeed() {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = CONSTANTS.BALL.MAX_SPEED * 1.2; // Permitir velocidad algo mayor

        if (speed > maxSpeed) {
            const factor = maxSpeed / speed;
            this.vx *= factor;
            this.vy *= factor;
        }
    }

    kick(power, angle) {
        // Aumentar el poder del golpe
        const kickPower = power * 1.5;
        const maxKickPower = CONSTANTS.BALL.MAX_SPEED * 1.2;
        const actualPower = Math.min(kickPower, maxKickPower);

        this.vx += Math.cos(angle) * actualPower;
        this.vy += Math.sin(angle) * actualPower;

        // Añadir un poco de variación aleatoria al golpe
        this.vx += (Math.random() - 0.5) * 2;
        this.vy += (Math.random() - 0.5) * 2;

        this.limitSpeed();
    }

    collideWithPlayer(player) {
        // Aumentar el rebote en colisiones con jugadores
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        const nx = dx / distance;
        const ny = dy / distance;

        // Calcular la velocidad relativa
        const relativeVelocityX = this.vx - player.vx;
        const relativeVelocityY = this.vy - player.vy;
        const relativeVelocity = relativeVelocityX * nx + relativeVelocityY * ny;

        // Si los objetos se están alejando, no hacer nada
        if (relativeVelocity > 0) return;

        // Calcular el impulso con más rebote
        const impulse = -(1 + this.RESTITUTION) * relativeVelocity;
        const j = impulse / (1 / this.mass + 1 / player.mass);

        // Aplicar el impulso
        this.vx += j * nx / this.mass;
        this.vy += j * ny / this.mass;

        // Añadir un poco de la velocidad del jugador
        this.vx += player.vx * 0.3;
        this.vy += player.vy * 0.3;

        // Añadir variación aleatoria
        this.vx += (Math.random() - 0.5) * 2;
        this.vy += (Math.random() - 0.5) * 2;
    }

    isInGoal() {
        const goalY1 = (CONSTANTS.FIELD.HEIGHT - CONSTANTS.FIELD.GOAL_SIZE) / 2;
        const goalY2 = goalY1 + CONSTANTS.FIELD.GOAL_SIZE;

        if (this.y >= goalY1 && this.y <= goalY2) {
            if (this.x - this.radius <= 0) return 'right';
            if (this.x + this.radius >= CONSTANTS.FIELD.WIDTH) return 'left';
        }
        return null;
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            radius: this.radius
        };
    }
}

module.exports = Ball;

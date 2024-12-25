const CONSTANTS = require('../shared/constants');
const Physics = require('./Physics');

class Player {
    constructor(id, name, side) {
        this.id = id;
        this.name = name;
        this.side = side;
        this.radius = CONSTANTS.PLAYER.RADIUS;
        this.mass = 5;
        this.input = { x: 0, y: 0 };
        this.lastKick = 0;
        this.kickCooldown = 150; // Reducido para mejor respuesta

        // Nuevas propiedades para movimiento más fluido
        this.acceleration = 0.8;
        this.deceleration = 0.85;
        this.maxSpeed = 12; // Aumentada la velocidad máxima
        this.baseSpeed = 8;  // Velocidad base más alta
        this.diagonalCompensation = Math.sqrt(2);

        this.reset();
    }

    reset() {
        if (this.side === 'left') {
            this.x = CONSTANTS.FIELD.WIDTH * 0.25;
        } else {
            this.x = CONSTANTS.FIELD.WIDTH * 0.75;
        }
        this.y = CONSTANTS.FIELD.HEIGHT / 2;
        this.vx = 0;
        this.vy = 0;
    }

    update(input) {
        // Normalizar input diagonal
        if (input.x !== 0 && input.y !== 0) {
            const magnitude = Math.sqrt(input.x * input.x + input.y * input.y);
            input.x /= magnitude;
            input.y /= magnitude;
        }

        // Aplicar aceleración gradual
        const targetVX = input.x * this.baseSpeed;
        const targetVY = input.y * this.baseSpeed;

        // Aceleración más suave
        this.vx += (targetVX - this.vx) * this.acceleration;
        this.vy += (targetVY - this.vy) * this.acceleration;

        // Aplicar desaceleración cuando no hay input
        if (input.x === 0) {
            this.vx *= this.deceleration;
        }
        if (input.y === 0) {
            this.vy *= this.deceleration;
        }

        // Detener el movimiento si la velocidad es muy baja
        if (Math.abs(this.vx) < 0.01) this.vx = 0;
        if (Math.abs(this.vy) < 0.01) this.vy = 0;

        // Limitar velocidad máxima
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > this.maxSpeed) {
            const factor = this.maxSpeed / currentSpeed;
            this.vx *= factor;
            this.vy *= factor;
        }

        // Sprint opcional (boost temporal)
        if (input.sprint) {
            this.vx *= 1.3;
            this.vy *= 1.3;
        }

        // Actualizar posición
        this.x += this.vx;
        this.y += this.vy;

        // Mantener dentro del campo con rebote
        this.constrainToField();
    }

    constrainToField() {
        const minX = this.radius + CONSTANTS.FIELD.WALL_THICKNESS;
        const maxX = CONSTANTS.FIELD.WIDTH - this.radius - CONSTANTS.FIELD.WALL_THICKNESS;
        const minY = this.radius + CONSTANTS.FIELD.WALL_THICKNESS;
        const maxY = CONSTANTS.FIELD.HEIGHT - this.radius - CONSTANTS.FIELD.WALL_THICKNESS;

        // Colisión con rebote en las paredes
        if (this.x < minX) {
            this.x = minX;
            this.vx = -this.vx * 0.5; // Rebote con pérdida de energía
        } else if (this.x > maxX) {
            this.x = maxX;
            this.vx = -this.vx * 0.5;
        }

        if (this.y < minY) {
            this.y = minY;
            this.vy = -this.vy * 0.5;
        } else if (this.y > maxY) {
            this.y = maxY;
            this.vy = -this.vy * 0.5;
        }
    }

    kick(ball) {
        if (!this.canKick()) return false;

        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.radius + ball.radius) {
            const angle = Math.atan2(dy, dx);

            // Potencia de patada basada en la velocidad actual del jugador
            const playerSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const basePower = CONSTANTS.PLAYER.KICK_POWER;
            const speedBonus = playerSpeed / this.maxSpeed;
            const power = basePower * (1 + speedBonus) * 
                (1 - distance / (this.radius + ball.radius));

            ball.kick(power, angle);

            // Transferir algo de momento del jugador a la pelota
            ball.vx += this.vx * 0.3;
            ball.vy += this.vy * 0.3;

            this.lastKick = Date.now();
            return true;
        }

        return false;
    }

    canKick() {
        return Date.now() - this.lastKick >= this.kickCooldown;
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            side: this.side,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            radius: this.radius
        };
    }
}

module.exports = Player;

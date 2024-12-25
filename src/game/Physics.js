const CONSTANTS = require('../shared/constants');

class Physics {
    static updatePosition(object) {
        object.x += object.vx;
        object.y += object.vy;
    }

    static checkCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.radius + circle2.radius);
    }

    static resolveCollision(player, ball) {
        // Calcular el vector de colisión
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // Evitar división por cero

        // Normalizar el vector de colisión
        const nx = dx / distance;
        const ny = dy / distance;

        // Calcular la velocidad relativa
        const relativeVelocityX = ball.vx - player.vx;
        const relativeVelocityY = ball.vy - player.vy;

        // Calcular el producto punto de la velocidad relativa y la normal
        const velocityDotProduct = (relativeVelocityX * nx + relativeVelocityY * ny);

        // Si los objetos se están alejando, no hacer nada
        if (velocityDotProduct > 0) return;

        // Coeficiente de restitución (elasticidad del rebote)
        const restitution = 1.5;

        // Factor de impulso
        const impulseFactor = -(1 + restitution) * velocityDotProduct;
        const totalMass = player.mass + ball.mass;
        const impulse = impulseFactor / totalMass;

        // Aplicar el impulso
        ball.vx = ball.vx + (impulse * ball.mass * nx);
        ball.vy = ball.vy + (impulse * ball.mass * ny);

        // Añadir un poco de la velocidad del jugador a la pelota
        ball.vx += player.vx * 0.2;
        ball.vy += player.vy * 0.2;

        // Separar los objetos para evitar que se peguen
        const overlap = (player.radius + ball.radius) - distance;
        if (overlap > 0) {
            ball.x += overlap * nx;
            ball.y += overlap * ny;
        }

        // Limitar la velocidad máxima de la pelota
        const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (ballSpeed > CONSTANTS.BALL.MAX_SPEED) {
            const factor = CONSTANTS.BALL.MAX_SPEED / ballSpeed;
            ball.vx *= factor;
            ball.vy *= factor;
        }
    }

    static checkWallCollision(object, field) {
        let collision = false;

        // Colisión con paredes horizontales
        if (object.y - object.radius < 0) {
            object.y = object.radius;
            object.vy = -object.vy * 0.8;
            collision = true;
        } else if (object.y + object.radius > field.HEIGHT) {
            object.y = field.HEIGHT - object.radius;
            object.vy = -object.vy * 0.8;
            collision = true;
        }

        // Colisión con paredes verticales (excepto las porterías)
        if (object.x - object.radius < 0) {
            // Verificar si está en la zona de la portería
            if (object.y < (field.HEIGHT - field.GOAL_SIZE) / 2 || 
                object.y > (field.HEIGHT + field.GOAL_SIZE) / 2) {
                object.x = object.radius;
                object.vx = -object.vx * 0.8;
                collision = true;
            }
        } else if (object.x + object.radius > field.WIDTH) {
            // Verificar si está en la zona de la portería
            if (object.y < (field.HEIGHT - field.GOAL_SIZE) / 2 || 
                object.y > (field.HEIGHT + field.GOAL_SIZE) / 2) {
                object.x = field.WIDTH - object.radius;
                object.vx = -object.vx * 0.8;
                collision = true;
            }
        }

        return collision;
    }

    static applyFriction(object) {
        object.vx *= CONSTANTS.BALL.SPEED_DECAY;
        object.vy *= CONSTANTS.BALL.SPEED_DECAY;
    }
}

module.exports = Physics;

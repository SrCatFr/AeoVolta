const CONSTANTS = require('../shared/constants');


class Field {
    constructor() {
        this.width = CONSTANTS.FIELD.WIDTH;
        this.height = CONSTANTS.FIELD.HEIGHT;
        this.goals = {
            left: {
                x: 0,
                y: (CONSTANTS.FIELD.HEIGHT - CONSTANTS.FIELD.GOAL_SIZE) / 2,
                width: CONSTANTS.FIELD.WALL_THICKNESS,
                height: CONSTANTS.FIELD.GOAL_SIZE
            },
            right: {
                x: CONSTANTS.FIELD.WIDTH - CONSTANTS.FIELD.WALL_THICKNESS,
                y: (CONSTANTS.FIELD.HEIGHT - CONSTANTS.FIELD.GOAL_SIZE) / 2,
                width: CONSTANTS.FIELD.WALL_THICKNESS,
                height: CONSTANTS.FIELD.GOAL_SIZE
            }
        };
        this.walls = this.createWalls();
    }

    createWalls() {
        return [
            // Pared superior
            {
                x: 0,
                y: 0,
                width: this.width,
                height: CONSTANTS.FIELD.WALL_THICKNESS
            },
            // Pared inferior
            {
                x: 0,
                y: this.height - CONSTANTS.FIELD.WALL_THICKNESS,
                width: this.width,
                height: CONSTANTS.FIELD.WALL_THICKNESS
            },
            // Pared izquierda superior
            {
                x: 0,
                y: 0,
                width: CONSTANTS.FIELD.WALL_THICKNESS,
                height: this.goals.left.y
            },
            // Pared izquierda inferior
            {
                x: 0,
                y: this.goals.left.y + this.goals.left.height,
                width: CONSTANTS.FIELD.WALL_THICKNESS,
                height: this.height - (this.goals.left.y + this.goals.left.height)
            },
            // Pared derecha superior
            {
                x: this.width - CONSTANTS.FIELD.WALL_THICKNESS,
                y: 0,
                width: CONSTANTS.FIELD.WALL_THICKNESS,
                height: this.goals.right.y
            },
            // Pared derecha inferior
            {
                x: this.width - CONSTANTS.FIELD.WALL_THICKNESS,
                y: this.goals.right.y + this.goals.right.height,
                width: CONSTANTS.FIELD.WALL_THICKNESS,
                height: this.height - (this.goals.right.y + this.goals.right.height)
            }
        ];
    }

    checkGoal(ball) {
        // Verificar gol izquierdo
        if (ball.x - ball.radius <= CONSTANTS.FIELD.WALL_THICKNESS &&
            ball.y >= this.goals.left.y &&
            ball.y <= this.goals.left.y + this.goals.left.height) {
            return 'right'; // Gol para el equipo derecho
        }
        // Verificar gol derecho
        if (ball.x + ball.radius >= this.width - CONSTANTS.FIELD.WALL_THICKNESS &&
            ball.y >= this.goals.right.y &&
            ball.y <= this.goals.right.y + this.goals.right.height) {
            return 'left'; // Gol para el equipo izquierdo
        }
        return null;
    }

    checkWallCollision(object) {
        let collision = false;

        this.walls.forEach(wall => {
            if (this.checkCollisionWithWall(object, wall)) {
                collision = true;
            }
        });

        return collision;
    }

    checkCollisionWithWall(object, wall) {
        // Encontrar el punto más cercano en la pared al objeto
        const closestX = Math.max(wall.x, Math.min(object.x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(object.y, wall.y + wall.height));

        // Calcular la distancia entre el objeto y el punto más cercano
        const distanceX = object.x - closestX;
        const distanceY = object.y - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Hay colisión si la distancia es menor que el radio del objeto
        return distance < object.radius;
    }
}

module.exports = Field;

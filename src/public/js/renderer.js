class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.isReady = false;

        // Establecer tamaño inicial del canvas
        this.setInitialSize();

        // Realizar el primer resize después de un pequeño delay
        setTimeout(() => {
            this.resize();
            this.isReady = true;
            console.log('Renderer inicializado');
            this.drawField(); // Dibujar campo inicial
        }, 100);

        window.addEventListener('resize', () => this.handleResize());
    }

    setInitialSize() {
        // Establecer un tamaño base para el canvas
        this.canvas.width = CONSTANTS.FIELD.WIDTH;
        this.canvas.height = CONSTANTS.FIELD.HEIGHT;
    }

    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.resize();
        }, 250);
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calcular el factor de escala manteniendo el aspect ratio
        const gameAspectRatio = CONSTANTS.FIELD.WIDTH / CONSTANTS.FIELD.HEIGHT;
        const containerAspectRatio = containerWidth / containerHeight;

        let width, height;

        if (containerAspectRatio > gameAspectRatio) {
            height = containerHeight;
            width = height * gameAspectRatio;
        } else {
            width = containerWidth;
            height = width / gameAspectRatio;
        }

        // Actualizar el tamaño del canvas
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.canvas.width = CONSTANTS.FIELD.WIDTH;
        this.canvas.height = CONSTANTS.FIELD.HEIGHT;

        // Calcular la escala
        this.scale = width / CONSTANTS.FIELD.WIDTH;

        // Redibujar el campo
        this.drawField();
    }

    clear() {
        if (!this.isReady) return;
        this.ctx.fillStyle = CONSTANTS.COLORS.FIELD;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawField() {
        if (!this.isReady) return;

        // Limpiar el canvas
        this.clear();

        // Dibujar el campo
        this.ctx.strokeStyle = CONSTANTS.COLORS.WALLS;
        this.ctx.lineWidth = CONSTANTS.FIELD.WALL_THICKNESS;

        // Borde del campo
        this.ctx.beginPath();
        this.ctx.rect(
            CONSTANTS.FIELD.WALL_THICKNESS / 2,
            CONSTANTS.FIELD.WALL_THICKNESS / 2,
            this.canvas.width - CONSTANTS.FIELD.WALL_THICKNESS,
            this.canvas.height - CONSTANTS.FIELD.WALL_THICKNESS
        );

        // Línea central
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);

        // Círculo central
        this.ctx.arc(
            this.canvas.width / 2,
            this.canvas.height / 2,
            50,
            0,
            Math.PI * 2
        );

        // Porterías
        const goalY1 = (this.canvas.height - CONSTANTS.FIELD.GOAL_SIZE) / 2;
        const goalY2 = goalY1 + CONSTANTS.FIELD.GOAL_SIZE;

        // Portería izquierda
        this.ctx.rect(
            0,
            goalY1,
            CONSTANTS.FIELD.WALL_THICKNESS,
            CONSTANTS.FIELD.GOAL_SIZE
        );

        // Portería derecha
        this.ctx.rect(
            this.canvas.width - CONSTANTS.FIELD.WALL_THICKNESS,
            goalY1,
            CONSTANTS.FIELD.WALL_THICKNESS,
            CONSTANTS.FIELD.GOAL_SIZE
        );

        this.ctx.stroke();
    }

    drawPlayer(player, color) {
        if (!this.isReady || !player) return;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            player.x,
            player.y,
            CONSTANTS.PLAYER.RADIUS,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Nombre del jugador
        if (player.name) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Exo';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                player.name,
                player.x,
                player.y - CONSTANTS.PLAYER.RADIUS - 10
            );
        }
    }

    drawBall(ball) {
        if (!this.isReady || !ball) return;

        this.ctx.fillStyle = CONSTANTS.COLORS.BALL;
        this.ctx.beginPath();
        this.ctx.arc(
            ball.x,
            ball.y,
            CONSTANTS.BALL.RADIUS,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
}

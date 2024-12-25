class Controls {
    constructor(element) {
        this.element = element;
        this.position = { x: 0, y: 0 };
        this.isActive = false;
        this.startPos = { x: 0, y: 0 };
        this.setupEvents();
    }

    setupEvents() {
        this.element.addEventListener('touchstart', (e) => this.handleStart(e));
        this.element.addEventListener('touchmove', (e) => this.handleMove(e));
        this.element.addEventListener('touchend', () => this.handleEnd());
    }

    handleStart(e) {
        const touch = e.touches[0];
        const rect = this.element.getBoundingClientRect();
        this.isActive = true;
        this.startPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    handleMove(e) {
        if (!this.isActive) return;

        const touch = e.touches[0];
        const rect = this.element.getBoundingClientRect();

        const currentPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };

        const delta = {
            x: (currentPos.x - this.startPos.x) / rect.width,
            y: (currentPos.y - this.startPos.y) / rect.height
        };

        // Normalizar valores entre -1 y 1
        const magnitude = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        if (magnitude > 1) {
            delta.x /= magnitude;
            delta.y /= magnitude;
        }

        this.position = delta;
    }

    handleEnd() {
        this.isActive = false;
        this.position = { x: 0, y: 0 };
    }

    getInput() {
        return this.position;
    }
}

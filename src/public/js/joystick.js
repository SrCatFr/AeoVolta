class Joystick {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = {
            size: options.size || 100,
            maxDistance: options.maxDistance || 50,
            deadzone: options.deadzone || 0.2
        };

        this.position = { x: 0, y: 0 };
        this.createJoystick();
        this.bindEvents();
    }

    createJoystick() {
        this.base = document.createElement('div');
        this.base.className = 'joystick-base';
        this.stick = document.createElement('div');
        this.stick.className = 'joystick-stick';
        
        this.base.appendChild(this.stick);
        this.container.appendChild(this.base);
    }

    bindEvents() {
        this.container.addEventListener('touchstart', (e) => this.handleStart(e));
        this.container.addEventListener('touchmove', (e) => this.handleMove(e));
        this.container.addEventListener('touchend', (e) => this.handleEnd(e));
    }

    handleStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.base.getBoundingClientRect();
        this.startPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    handleMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        
        let deltaX = touch.clientX - this.startPosition.x;
        let deltaY = touch.clientY - this.startPosition.y;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > this.options.maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * this.options.maxDistance;
            deltaY = Math.sin(angle) * this.options.maxDistance;
        }

        this.position = {
            x: deltaX / this.options.maxDistance,
            y: deltaY / this.options.maxDistance
        };

        this.stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    handleEnd() {
        this.position = { x: 0, y: 0 };
        this.stick.style.transform = 'translate(0px, 0px)';
    }

    getPosition() {
        return this.position;
    }
}

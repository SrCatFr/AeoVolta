class AudioManager {
    constructor() {
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.goalSound = document.getElementById('goalSound');
        this.whistleSound = document.getElementById('whistleSound');
        this.kickSound = document.getElementById('kickSound');

        // Configurar volúmenes
        if (this.backgroundMusic) this.backgroundMusic.volume = 0.3;
        if (this.goalSound) this.goalSound.volume = 0.6;
        if (this.whistleSound) this.whistleSound.volume = 0.5;
        if (this.kickSound) this.kickSound.volume = 0.4;

        this.isMusicEnabled = true;
        this.isSoundEnabled = true;

        this.setupControls();
        this.preloadSounds();
    }

    preloadSounds() {
        const sounds = [this.goalSound, this.whistleSound, this.kickSound];
        sounds.forEach(sound => {
            if (sound) sound.load();
        });

        // Intentar iniciar la música de fondo con interacción del usuario
        document.addEventListener('click', () => {
            if (this.isMusicEnabled && this.backgroundMusic) {
                this.backgroundMusic.play().catch(() => {
                    console.log('Autoplay prevented');
                });
            }
        }, { once: true });
    }

    setupControls() {
        const musicBtn = document.getElementById('toggleMusic');
        const soundBtn = document.getElementById('toggleSound');

        if (musicBtn) {
            musicBtn.addEventListener('click', () => this.toggleMusic());
        }
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.toggleSound());
        }
    }

    toggleMusic() {
        this.isMusicEnabled = !this.isMusicEnabled;
        const musicIcon = document.querySelector('#toggleMusic i');

        if (this.isMusicEnabled && this.backgroundMusic) {
            this.backgroundMusic.play();
            if (musicIcon) musicIcon.className = 'fas fa-music';
        } else if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            if (musicIcon) musicIcon.className = 'fas fa-music-slash';
        }
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        const soundIcon = document.querySelector('#toggleSound i');
        if (soundIcon) {
            soundIcon.className = this.isSoundEnabled ? 
                'fas fa-volume-up' : 
                'fas fa-volume-mute';
        }
    }

    playGoal() {
        if (this.isSoundEnabled && this.goalSound) {
            this.goalSound.currentTime = 0;
            this.goalSound.play().catch(console.error);
        }
    }

    playWhistle() {
        if (this.isSoundEnabled && this.whistleSound) {
            this.whistleSound.currentTime = 0;
            this.whistleSound.play().catch(console.error);
        }
    }

    playKick() {
        if (this.isSoundEnabled && this.kickSound) {
            this.kickSound.currentTime = 0;
            this.kickSound.play().catch(console.error);
        }
    }
}

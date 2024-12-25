class Timer {
  constructor(duration = 120) { // Duración en segundos
      this.duration = duration;
      this.reset();
  }

  reset() {
      this.startTime = null;
      this.pauseTime = null;
      this.isPaused = false;
      this.isFinished = false;
  }

  start() {
      if (!this.startTime) {
          this.startTime = Date.now();
      } else if (this.isPaused) {
          const pauseDuration = Date.now() - this.pauseTime;
          this.startTime += pauseDuration;
          this.isPaused = false;
      }
  }

  pause() {
      if (!this.isPaused && !this.isFinished) {
          this.pauseTime = Date.now();
          this.isPaused = true;
      }
  }

  getTimeLeft() {
      if (!this.startTime) return this.duration;
      if (this.isPaused) {
          return Math.max(0, this.duration - (this.pauseTime - this.startTime) / 1000);
      }
      const timeLeft = Math.max(0, this.duration - (Date.now() - this.startTime) / 1000);
      if (timeLeft === 0) {
          this.isFinished = true;
      }
      return timeLeft;
  }

  getFormattedTime() {
      const timeLeft = Math.ceil(this.getTimeLeft());
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isTimeUp() {
      return this.isFinished;
  }

  getState() {
      return {
          timeLeft: this.getTimeLeft(),
          formatted: this.getFormattedTime(),
          isFinished: this.isFinished
      };
  }
}

module.exports = Timer;

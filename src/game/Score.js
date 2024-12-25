class Score {
  constructor() {
      this.reset();
  }

  reset() {
      this.scores = {
          left: 0,
          right: 0
      };
  }

  addGoal(side) {
      this.scores[side]++;
  }

  getScore() {
      return this.scores;
  }

  getWinner() {
      if (this.scores.left > this.scores.right) {
          return 'left';
      } else if (this.scores.right > this.scores.left) {
          return 'right';
      }
      return 'tie';
  }

  getState() {
      return {
          left: this.scores.left,
          right: this.scores.right
      };
  }
}

module.exports = Score;

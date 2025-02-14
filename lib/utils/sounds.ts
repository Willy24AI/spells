export const sounds = {
  playCorrect: () => {
    const audio = new Audio('/sounds/correct.mp3');
    audio.play().catch(() => {
      // Ignore errors - some browsers block autoplay
    });
  },

  playIncorrect: () => {
    const audio = new Audio('/sounds/incorrect.mp3');
    audio.play().catch(() => {
      // Ignore errors - some browsers block autoplay
    });
  },

  playPangram: () => {
    const audio = new Audio('/sounds/pangram.mp3');
    audio.play().catch(() => {
      // Ignore errors - some browsers block autoplay
    });
  },

  playGameOver: () => {
    const audio = new Audio('/sounds/game-over.mp3');
    audio.play().catch(() => {
      // Ignore errors - some browsers block autoplay
    });
  }
};
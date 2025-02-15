// lib/utils/sounds.ts

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private soundEnabled: boolean = true;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    this.sounds = {
      correct: new Audio('/sounds/correct.mp3'),
      incorrect: new Audio('/sounds/incorrect.mp3'),
      pangram: new Audio('/sounds/pangram.mp3'),
      gameOver: new Audio('/sounds/game-over.mp3')
    };

    // Set volume for all sounds
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.5; // Set to 50% volume
    });
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  private playSound(soundKey: keyof typeof this.sounds) {
    if (!this.soundEnabled) return;

    const sound = this.sounds[soundKey];
    if (sound) {
      // Stop and reset the sound if it's already playing
      sound.pause();
      sound.currentTime = 0;
      
      // Play the sound and handle any errors
      sound.play().catch(error => {
        console.warn(`Failed to play sound ${soundKey}:`, error);
      });
    }
  }

  public playCorrect() {
    this.playSound('correct');
  }

  public playIncorrect() {
    this.playSound('incorrect');
  }

  public playPangram() {
    this.playSound('pangram');
  }

  public playGameOver() {
    this.playSound('gameOver');
  }
}

// Export a singleton instance
export const soundManager = new SoundManager();
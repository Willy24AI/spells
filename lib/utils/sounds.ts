import { isBrowser } from '@/lib/utils/environment';

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement | null } = {};
  private soundEnabled: boolean = true;

  constructor() {
    if (isBrowser) {
      this.initializeSounds();
    }
  }

  private initializeSounds() {
    if (!isBrowser) return;

    try {
      this.sounds = {
        correct: new window.Audio('/sounds/correct.mp3'),
        incorrect: new window.Audio('/sounds/incorrect.mp3'),
        pangram: new window.Audio('/sounds/pangram.mp3'),
        gameOver: new window.Audio('/sounds/game-over.mp3')
      };

      // Set volume for all sounds
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.volume = 0.5; // Set to 50% volume
        }
      });
    } catch (error) {
      console.warn('Failed to initialize sounds:', error);
      // Initialize with null values if audio creation fails
      this.sounds = {
        correct: null,
        incorrect: null,
        pangram: null,
        gameOver: null
      };
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  private async playSound(soundKey: keyof typeof this.sounds) {
    if (!this.soundEnabled || !isBrowser) return;

    const sound = this.sounds[soundKey];
    if (sound) {
      try {
        // Stop and reset the sound if it's already playing
        sound.pause();
        sound.currentTime = 0;
        
        // Play the sound
        await sound.play();
      } catch (error) {
        console.warn(`Failed to play sound ${soundKey}:`, error);
      }
    }
  }

  public playCorrect() {
    return this.playSound('correct');
  }

  public playIncorrect() {
    return this.playSound('incorrect');
  }

  public playPangram() {
    return this.playSound('pangram');
  }

  public playGameOver() {
    return this.playSound('gameOver');
  }

  public preloadSounds() {
    if (!isBrowser) return;
    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.load();
      }
    });
  }
}

// Export a singleton instance
export const soundManager = new SoundManager();
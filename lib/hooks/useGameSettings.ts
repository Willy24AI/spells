// lib/hooks/useGameSettings.ts
"use client";

import { useState, useEffect } from 'react';
import { storage } from '@/lib/utils/localStorage';
import { soundManager } from '@/lib/utils/sounds';

const SETTINGS_KEY = 'game_settings';

interface GameSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  showTimer: boolean;
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  darkMode: false,
  showTimer: false
};

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = storage.get(SETTINGS_KEY);
    if (savedSettings) {
      setSettings(savedSettings);
      // Apply saved settings
      soundManager.setEnabled(savedSettings.soundEnabled);
      if (savedSettings.darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const updateSetting = (key: keyof GameSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storage.set(SETTINGS_KEY, newSettings);

    // Apply settings changes
    switch (key) {
      case 'soundEnabled':
        soundManager.setEnabled(value);
        break;
      case 'darkMode':
        document.documentElement.classList.toggle('dark', value);
        break;
      default:
        break;
    }
  };

  return { settings, updateSetting };
}
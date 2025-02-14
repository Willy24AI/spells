"use client";

import { useState, useEffect } from 'react';
import { storage } from '@/lib/utils/localStorage';

interface GameSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  showTimer: boolean;
}

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    darkMode: false,
    showTimer: false
  });

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = storage.get('settings');
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  const updateSetting = (key: keyof GameSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storage.set('settings', newSettings);

    // Apply settings
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value);
    }
  };

  // Apply initial dark mode setting
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  return { settings, updateSetting };
}
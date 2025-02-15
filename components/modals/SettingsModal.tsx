// components/modals/SettingsModal.tsx
"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, Moon, Clock } from 'lucide-react';

export interface GameSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  showTimer: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingChange: (setting: keyof GameSettings, value: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingChange
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Volume2 className="w-5 h-5 text-gray-500" />
            <div>
              <Label htmlFor="sound-toggle" className="text-base font-medium">Sound Effects</Label>
              <p className="text-sm text-gray-500">Enable game sounds and effects</p>
            </div>
          </div>
          <Switch
            id="sound-toggle"
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => onSettingChange('soundEnabled', checked)}
            className="data-[state=checked]:bg-yellow-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Moon className="w-5 h-5 text-gray-500" />
            <div>
              <Label htmlFor="dark-mode-toggle" className="text-base font-medium">Dark Mode</Label>
              <p className="text-sm text-gray-500">Switch to dark theme</p>
            </div>
          </div>
          <Switch
            id="dark-mode-toggle"
            checked={settings.darkMode}
            onCheckedChange={(checked) => onSettingChange('darkMode', checked)}
            className="data-[state=checked]:bg-yellow-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <Label htmlFor="timer-toggle" className="text-base font-medium">Show Timer</Label>
              <p className="text-sm text-gray-500">Display game timer</p>
            </div>
          </div>
          <Switch
            id="timer-toggle"
            checked={settings.showTimer}
            onCheckedChange={(checked) => onSettingChange('showTimer', checked)}
            className="data-[state=checked]:bg-yellow-500"
          />
        </div>
      </div>
    </Modal>
  );
}
"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/switch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    soundEnabled: boolean;
    darkMode: boolean;
    showTimer: boolean;
  };
  onSettingChange: (setting: string, value: boolean) => void;
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
          <div>
            <h3 className="font-medium">Sound Effects</h3>
            <p className="text-sm text-gray-500">Enable game sounds</p>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => onSettingChange('soundEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Dark Mode</h3>
            <p className="text-sm text-gray-500">Switch to dark theme</p>
          </div>
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(checked) => onSettingChange('darkMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Show Timer</h3>
            <p className="text-sm text-gray-500">Display game timer</p>
          </div>
          <Switch
            checked={settings.showTimer}
            onCheckedChange={(checked) => onSettingChange('showTimer', checked)}
          />
        </div>
      </div>
    </Modal>
  );
}
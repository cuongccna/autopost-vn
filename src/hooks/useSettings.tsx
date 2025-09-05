'use client';

import { useState, useContext, createContext, ReactNode } from 'react';

interface SettingsData {
  notifySuccess: boolean;
  notifyFail: boolean;
  notifyToken: boolean;
  timezone: string;
  golden: string[];
  rateLimit: number;
}

interface SettingsContextType {
  settings: SettingsData;
  updateSettings: (_newSettings: SettingsData) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsData = {
  notifySuccess: true,
  notifyFail: true,
  notifyToken: true,
  timezone: 'Asia/Ho_Chi_Minh',
  golden: ['09:00', '12:30', '20:00'],
  rateLimit: 10,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  const updateSettings = (newSettings: SettingsData) => {
    setSettings(newSettings);
    // Here you could also save to localStorage or API
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

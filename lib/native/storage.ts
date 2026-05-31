import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function getApiKey(key: string): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setApiKey(key: string, value: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

export async function removeApiKey(key: string): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

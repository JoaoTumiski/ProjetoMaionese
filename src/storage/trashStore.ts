// src/storage/trashStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TrashItem = {
  id: string;
  uri: string;
  filename?: string;
  deletedAt: string;
};

const STORAGE_KEY = '@app_trash_v1';
const STORAGE_PREMIUM = '@is_premium';
const DEFAULT_MAX = 100;

async function getRaw(): Promise<TrashItem[]> {
  try {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    return JSON.parse(s) as TrashItem[];
  } catch (err) {
    console.warn('trashStore.getRaw error', err);
    return [];
  }
}

export async function getTrash(): Promise<TrashItem[]> {
  return getRaw();
}

/**
 * Set premium flag (persisted). Use true for premium users (unlimited trash).
 */
export async function setPremiumFlag(isPremium: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREMIUM, isPremium ? '1' : '0');
  } catch (e) {
    console.warn('setPremiumFlag error', e);
  }
}

export async function isPremium(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_PREMIUM);
    return v === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Add an item to trash. Respects DEFAULT_MAX for non-premium users.
 * Returns { success: boolean, reason?: string }
 */
export async function addToTrash(item: TrashItem): Promise<{ success: boolean; reason?: string }> {
  try {
    const list = await getRaw();

    // Prevent duplicates (same id)
    if (list.find(i => i.id === item.id)) {
      return { success: false, reason: 'already_exists' };
    }

    const premium = await isPremium();
    if (!premium && list.length >= DEFAULT_MAX) {
      return { success: false, reason: 'limit_reached' };
    }

    const next = [item, ...list]; // newest first
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { success: true };
  } catch (err) {
    console.warn('trashStore.addToTrash error', err);
    return { success: false, reason: 'error' };
  }
}

export async function removeFromTrash(id: string): Promise<boolean> {
  try {
    const list = await getRaw();
    const next = list.filter(i => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch (err) {
    console.warn('trashStore.removeFromTrash error', err);
    return false;
  }
}

export async function clearTrash(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('trashStore.clearTrash error', err);
    return false;
  }
}
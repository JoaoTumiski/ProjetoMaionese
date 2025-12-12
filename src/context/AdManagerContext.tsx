// src/context/AdManagerContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PremiumContext } from './PremiumContext';

type AdManagerCtx = {
  requestShowAd: () => Promise<boolean>;
  canShowAdNow: () => Promise<boolean>;
  getNextAllowedTimestamp: () => number | null;
  forceResetLastShown: () => Promise<void>;
  forceAllowOnce: () => Promise<void>; // allow next requestShowAd() immediately (one-time)
};

const STORAGE_KEY_LAST_SHOWN = '@ad:last_shown_ts';
const STORAGE_KEY_NEXT_ALLOWED = '@ad:next_allowed_ts';

// configuração: intervalo randômico entre MIN e MAX (segundos)
const MIN_SECONDS = 120; // 2 minutos
const MAX_SECONDS = 180; // 3 minutos

const AdManagerContext = createContext<AdManagerCtx | undefined>(undefined);

function randomIntervalSeconds(min = MIN_SECONDS, max = MAX_SECONDS) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const AdManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const nextAllowedRef = useRef<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_NEXT_ALLOWED);
        if (saved) {
          const ts = parseInt(saved, 10);
          if (!Number.isNaN(ts)) nextAllowedRef.current = ts;
        }
      } catch (e) {
        console.warn('AdManager hydrate failed', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const saveNextAllowed = useCallback(async (ts: number | null) => {
    nextAllowedRef.current = ts;
    try {
      if (ts === null) {
        await AsyncStorage.removeItem(STORAGE_KEY_NEXT_ALLOWED);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY_NEXT_ALLOWED, String(ts));
      }
    } catch (e) {
      console.warn('AdManager saveNextAllowed failed', e);
    }
  }, []);

  const markShownNow = useCallback(async () => {
    const now = Date.now();
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SHOWN, String(now));
    } catch (e) {
      console.warn('AdManager markShownNow error', e);
    }
    const interval = randomIntervalSeconds();
    const nextTs = now + interval * 1000;
    await saveNextAllowed(nextTs);
    return { now, nextTs, interval };
  }, [saveNextAllowed]);

  const getNextAllowedTimestamp = useCallback(() => {
    return nextAllowedRef.current ?? null;
  }, []);

  const canShowAdNow = useCallback(async () => {
    if (premiumLoading) return false;
    if (isPremium) return false;
    if (!hydrated) return false;

    const nextAllowed = nextAllowedRef.current;
    if (!nextAllowed) return true;
    const now = Date.now();
    return now >= nextAllowed;
  }, [isPremium, premiumLoading, hydrated]);

  const requestShowAd = useCallback(async (): Promise<boolean> => {
    if (premiumLoading) return false;
    if (isPremium) return false;
    if (!hydrated) return false;

    const allowed = await canShowAdNow();
    if (!allowed) return false;

    try {
      await markShownNow();
    } catch (e) {
      console.warn('AdManager requestShowAd markShownNow failed', e);
    }
    return true;
  }, [isPremium, premiumLoading, hydrated, canShowAdNow, markShownNow]);

  const forceResetLastShown = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_LAST_SHOWN);
      await saveNextAllowed(null);
      nextAllowedRef.current = null;
    } catch (e) {
      console.warn('AdManager forceResetLastShown', e);
    }
  }, [saveNextAllowed]);

  // nova função: força que a próxima requestShowAd() seja permitida imediatamente.
  const forceAllowOnce = useCallback(async () => {
    try {
      // set nextAllowed to a timestamp in the past so canShowAdNow will succeed
      const past = Date.now() - 1000;
      await saveNextAllowed(past); // persist so hydrate state matches
      nextAllowedRef.current = past;
    } catch (e) {
      console.warn('AdManager forceAllowOnce failed', e);
    }
  }, [saveNextAllowed]);

  const value: AdManagerCtx = {
    requestShowAd,
    canShowAdNow,
    getNextAllowedTimestamp,
    forceResetLastShown,
    forceAllowOnce,
  };

  return <AdManagerContext.Provider value={value}>{children}</AdManagerContext.Provider>;
};

export function useAdManager(): AdManagerCtx {
  const ctx = useContext(AdManagerContext);
  if (!ctx) throw new Error('useAdManager must be used within AdManagerProvider');
  return ctx;
}
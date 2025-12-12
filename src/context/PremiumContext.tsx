// src/context/PremiumContext.tsx
import React, { createContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app_premium';

// ======= DEBUG: troque aqui para forçar premium localmente (apenas para debug) =======
// Coloque `true` para forçar premium em todo o app durante desenvolvimento.
// Quando for testar comportamento real, deixe `false`.
const DEBUG_FORCE_PREMIUM = false;
// ======================================================================================

type PremiumContextValue = {
  isPremium: boolean;
  setPremium: (v: boolean) => Promise<void>;
  loading: boolean;
};

export const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  setPremium: async () => {},
  loading: true,
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // read persisted flag on mount (but allow DEBUG override)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (DEBUG_FORCE_PREMIUM) {
          // debug override: força premium e não espera AsyncStorage
          if (!mounted) return;
          setIsPremium(true);
        } else {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (!mounted) return;
          setIsPremium(raw === '1');
        }
      } catch (e) {
        console.warn('PremiumProvider: failed to read storage', e);
        if (mounted) setIsPremium(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // setPremium updates state and persists
  const setPremium = useCallback(async (v: boolean) => {
    try {
      setIsPremium(v);
      await AsyncStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch (e) {
      console.warn('PremiumProvider: failed to persist premium flag', e);
      // still update in-memory
      setIsPremium(v);
    }
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, setPremium, loading }}>
      {children}
    </PremiumContext.Provider>
  );
}
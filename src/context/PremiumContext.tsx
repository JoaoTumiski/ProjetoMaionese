// src/context/PremiumContext.tsx
import React, { createContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseService } from '../services/purchaseService';

const STORAGE_KEY = '@app_premium';

// ======= DEBUG: troque aqui para forçar premium localmente (apenas para debug) =======
const DEBUG_FORCE_PREMIUM = false;
// ======================================================================================

type PremiumContextValue = {
  isPremium: boolean;
  setPremium: (v: boolean) => Promise<void>;
  loading: boolean;
  refreshStatus: () => Promise<void>;
};

export const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  setPremium: async () => {},
  loading: true,
  refreshStatus: async () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await purchaseService.checkPremiumStatus();
      setIsPremium(status);
      await AsyncStorage.setItem(STORAGE_KEY, status ? '1' : '0');
    } catch (e) {
      console.warn('PremiumProvider: refreshStatus error', e);
    }
  }, []);

  // Inicialização e sincronização
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Primeiro tenta ler o cache rápido para não travar a UI
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && cached !== null) {
          setIsPremium(cached === '1' || DEBUG_FORCE_PREMIUM);
          setLoading(false); // Libera o loading se tiver cache
        }

        // Inicializa o serviço real de compras
        await purchaseService.initialize();
        const realStatus = await purchaseService.checkPremiumStatus();
        
        if (!mounted) return;

        const finalStatus = realStatus || DEBUG_FORCE_PREMIUM;
        setIsPremium(finalStatus);
        await AsyncStorage.setItem(STORAGE_KEY, finalStatus ? '1' : '0');
      } catch (e) {
        console.warn('PremiumProvider initialization error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setPremium = useCallback(async (v: boolean) => {
    try {
      setIsPremium(v);
      await AsyncStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch (e) {
      console.warn('PremiumProvider: failed to persist premium flag', e);
      setIsPremium(v);
    }
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, setPremium, loading, refreshStatus }}>
      {children}
    </PremiumContext.Provider>
  );
}
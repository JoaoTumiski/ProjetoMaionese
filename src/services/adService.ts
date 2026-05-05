// src/services/adService.ts
import { Platform } from 'react-native';

/**
 * AdService - Camada de abstração para o AdMob.
 * Centraliza os IDs e a lógica de carregamento/exibição.
 * Por enquanto, atua apenas como um reservatório de IDs e utilitários.
 */

const AD_UNITS = {
  ios: {
    banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS || 'ca-app-pub-3940256099942544/2934735716', // Test ID
    interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS || 'ca-app-pub-3940256099942544/4411468910', // Test ID
  },
  android: {
    banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || 'ca-app-pub-3940256099942544/6300978111', // Test ID
    interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID || 'ca-app-pub-3940256099942544/1033173712', // Test ID
  }
};

class AdService {
  getBannerId() {
    return Platform.OS === 'ios' ? AD_UNITS.ios.banner : AD_UNITS.android.banner;
  }

  getInterstitialId() {
    return Platform.OS === 'ios' ? AD_UNITS.ios.interstitial : AD_UNITS.android.interstitial;
  }

  /**
   * Inicializa o SDK (Ex: AdMob.initialize())
   */
  async initialize() {
    console.log('[AdService] Inicializando SDK de Ads...');
    // No futuro: await AdMob.initialize();
  }

  /**
   * Pré-carrega um anúncio intersticial (Ex: InterstitialAd.createForAdRequest(...))
   */
  async preloadInterstitial() {
    console.log('[AdService] Pré-carregando anúncio intersticial...');
  }
}

export const adService = new AdService();

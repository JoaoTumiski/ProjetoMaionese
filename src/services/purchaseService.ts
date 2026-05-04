// src/services/purchaseService.ts
import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';

// CONFIGURAÇÃO REVENUECAT
const REVENUECAT_API_KEY = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'goog_placeholder_ios_key',
  google: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_placeholder_android_key',
};

export const ENTITLEMENT_ID = 'premium_access'; // ID do benefício configurado no RevenueCat

class PurchaseService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY.apple });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY.google });
      }
      this.initialized = true;
      console.log('RevenueCat inicializado com sucesso.');
    } catch (e) {
      console.warn('Erro ao inicializar RevenueCat:', e);
    }
  }

  /**
   * Verifica se o usuário tem o benefício premium ativo.
   */
  async checkPremiumStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.isUserPremium(customerInfo);
    } catch (e) {
      console.warn('Erro ao verificar status premium:', e);
      return false;
    }
  }

  /**
   * Realiza a compra de um pacote (assinatura/doação).
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.isUserPremium(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn('Erro na compra:', e);
      }
      return false;
    }
  }

  /**
   * Restaura compras anteriores vinculadas à conta Apple/Google.
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.isUserPremium(customerInfo);
    } catch (e) {
      console.warn('Erro ao restaurar compras:', e);
      return false;
    }
  }

  /**
   * Obtém os pacotes de assinatura configurados para exibição.
   */
  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.warn('Erro ao buscar ofertas:', e);
      return [];
    }
  }

  private isUserPremium(customerInfo: CustomerInfo): boolean {
    // Verifica se o benefício específico está ativo
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  }
}

export const purchaseService = new PurchaseService();

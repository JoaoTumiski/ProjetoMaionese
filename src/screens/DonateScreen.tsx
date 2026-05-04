// src/screens/DonateScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { purchaseService } from '../services/purchaseService';
import { PremiumContext } from '../context/PremiumContext';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');

type Props = {
  onBack: () => void;
};

const BENEFITS = [
  { id: '1', text: 'Limpeza e Triagem de Vídeos', icon: 'videocam-outline' },
  { id: '2', text: 'Organização de Vídeos por Álbuns', icon: 'folder-open-outline' },
  { id: '3', text: 'Lixeira Ilimitada (Sem travas)', icon: 'trash-outline' },
  { id: '4', text: 'Experiência Sem Anúncios', icon: 'volume-mute-outline' },
  { id: '5', text: 'Apoie o Desenvolvimento', icon: 'heart-outline' },
];

export default function DonateScreen({ onBack }: Props) {
  const { isPremium, refreshStatus } = useContext(PremiumContext);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const available = await purchaseService.getOfferings();
        setPackages(available);
      } catch (e) {
        console.warn('Error loading offerings', e);
      } finally {
        setLoading(false);
      }
    }
    loadOfferings();
  }, []);

  async function handlePurchase(pkg: PurchasesPackage) {
    if (isPremium) {
      Alert.alert('Acesso Ativo', 'Você já é um apoiador premium!');
      return;
    }
    
    setPurchasing(true);
    const success = await purchaseService.purchasePackage(pkg);
    setPurchasing(false);

    if (success) {
      await refreshStatus();
      Alert.alert('Sucesso!', 'Obrigado por apoiar a Clear Galery. Agora você é Premium!');
      onBack();
    } else {
      // O erro já é logado no serviço ou cancelado pelo usuário
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    const success = await purchaseService.restorePurchases();
    setPurchasing(false);

    if (success) {
      await refreshStatus();
      Alert.alert('Restauração', 'Suas compras foram restauradas com sucesso!');
      onBack();
    } else {
      Alert.alert('Restauração', 'Não encontramos assinaturas ativas para esta conta.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Theme.colors.primary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Apoiar Projeto</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.premiumBadge}>
            <Ionicons name="heart" size={32} color={Theme.colors.primary} />
          </View>
          <Text style={styles.heading}>Apoie com quanto quiser</Text>
          <Text style={styles.subheading}>
            Contribua a partir de apenas R$ 1,00 para desbloquear funções extras e ajudar a manter o app no ar.
          </Text>
        </View>

        <View style={styles.benefitsList}>
          {BENEFITS.map((b) => (
            <View key={b.id} style={styles.benefitItem}>
              <View style={styles.benefitIconBox}>
                <Ionicons name={b.icon as any} size={20} color={Theme.colors.primary} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.offersSection}>
          {loading ? (
            <ActivityIndicator color={Theme.colors.primary} size="large" />
          ) : packages.length > 0 ? (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.packageCard}
                onPress={() => handlePurchase(pkg)}
                disabled={purchasing}
              >
                <View>
                  <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                  <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                </View>
                <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noOffers}>
              <Text style={styles.noOffersText}>
                Nenhum plano disponível no momento. Verifique sua conexão.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreBtnText}>Já contribuiu antes? Restaurar Acesso</Text>
        </TouchableOpacity>

        <Text style={styles.securityNote}>
          Sua contribuição ajuda a cobrir custos de servidor e ferramentas. Obrigado pelo apoio!
        </Text>
      </ScrollView>

      {purchasing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Processando...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: Theme.colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  content: { padding: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 179, 180, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  heading: { fontSize: 32, fontWeight: '800', color: Theme.colors.text, marginBottom: 8 },
  subheading: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  benefitsList: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: { fontSize: 15, color: Theme.colors.text, fontWeight: '500' },
  offersSection: { marginBottom: 24 },
  packageCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  packageTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  packageDesc: { fontSize: 13, color: Theme.colors.textSecondary },
  packagePrice: { fontSize: 20, fontWeight: '800', color: Theme.colors.primary },
  restoreBtn: { padding: 12, alignItems: 'center', marginBottom: 20 },
  restoreBtnText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  noOffers: { padding: 40, alignItems: 'center' },
  noOffersText: { color: Theme.colors.textMuted, textAlign: 'center' },
  securityNote: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayText: { color: '#fff', marginTop: 16, fontSize: 16, fontWeight: '600' },
});
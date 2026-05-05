// src/screens/DonateScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
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
import styles from './styles/DonateScreenStyles';

const { width } = Dimensions.get('window');

type Props = {
  onBack: () => void;
};

const BENEFITS = [
  { id: '1', text: 'Limpeza e Triagem de Vídeos', icon: 'videocam-outline' },
  { id: '2', text: 'Organização de Vídeos por Álbuns', icon: 'folder-open-outline' },
  { id: '3', text: 'Lixeira Ilimitada', icon: 'trash-outline' },
  { id: '4', text: 'Experiência Sem Anúncios', icon: 'megaphone-outline' },
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
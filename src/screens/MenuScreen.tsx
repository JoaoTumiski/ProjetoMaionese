// src/screens/MenuScreen.tsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumContext } from '../context/PremiumContext';
import { purchaseService } from '../services/purchaseService';
import Theme from '../styles/theme';
import styles from './styles/MenuScreenStyles';

type Props = {
  onBack: () => void;
  onOpenDonate: () => void;
  onOpenTrash: () => void;
};

export default function MenuScreen({ onBack, onOpenDonate, onOpenTrash }: Props) {
  const { isPremium, refreshStatus } = useContext(PremiumContext);

  async function handleRestore() {
    const success = await purchaseService.restorePurchases();
    if (success) {
      await refreshStatus();
      Alert.alert('Sucesso', 'Suas compras foram restauradas!');
    } else {
      Alert.alert('Restauração', 'Nenhuma assinatura ativa encontrada.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Menu</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusSection}>
          <View style={[styles.badge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
            <Text style={[styles.badgeText, isPremium ? styles.premiumBadgeText : styles.freeBadgeText]}>
              {isPremium ? 'ASSINANTE PREMIUM' : 'PLANO GRATUITO'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assinatura & Apoio</Text>
          {!isPremium && (
            <TouchableOpacity style={styles.menuItem} onPress={onOpenDonate}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="heart" size={22} color={Theme.colors.primary} />
                <Text style={styles.menuItemText}>Apoiar Projeto (R$ 1,00)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={handleRestore}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="refresh" size={22} color={Theme.colors.textSecondary} />
              <Text style={styles.menuItemText}>Restaurar Acesso</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciamento</Text>
          <TouchableOpacity style={styles.menuItem} onPress={onOpenTrash}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash" size={22} color={Theme.colors.textSecondary} />
              <Text style={styles.menuItemText}>Ver Lixeira</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Versão', 'Clear Galery v0.0.5')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle" size={22} color={Theme.colors.textSecondary} />
              <Text style={styles.menuItemText}>Versão do Aplicativo</Text>
            </View>
            <Text style={styles.versionText}>Beta 0.0.1</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2026 Vexos - Feito com ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

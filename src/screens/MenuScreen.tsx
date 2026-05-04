// src/screens/MenuScreen.tsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumContext } from '../context/PremiumContext';
import { purchaseService } from '../services/purchaseService';
import Theme from '../styles/theme';

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
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  content: { padding: 24 },
  profileSection: { alignItems: 'center', marginBottom: 40 },
  statusSection: { alignItems: 'center', marginBottom: 32 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  freeBadge: { backgroundColor: Theme.colors.surfaceContainer },
  freeBadgeText: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted },
  premiumBadge: { backgroundColor: 'rgba(255, 179, 180, 0.2)' },
  premiumBadgeText: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 16, fontWeight: '600', color: Theme.colors.text, marginLeft: 12 },
  versionText: { fontSize: 14, color: Theme.colors.textMuted },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 20,
    marginBottom: 40,
  },
});

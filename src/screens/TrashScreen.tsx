// src/screens/TrashScreen.tsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { getTrash, removeFromTrash, clearTrash, TrashItem } from '../storage/trashStore';
import { PremiumContext } from '../context/PremiumContext';
import { useAdManager } from '../context/AdManagerContext';
import FullscreenVideoAdMock from '../components/FullscreenVideoAd';
import Theme from '../styles/theme';

const PADDING = 20;
const THUMB = 60;

type Props = {
  onBack: () => void;
  onRestore?: (id: string) => void;
  onDeletePermanent?: (id: string) => void;
  onAddSpace?: () => void;
};

export default function TrashScreen({ onBack, onRestore, onDeletePermanent, onAddSpace }: Props) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);

  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? false : isPremium;

  const adManager = useAdManager();
  const [showAd, setShowAd] = useState(false);

  const pendingActionRef = useRef<null | 'bulkDelete'>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await getTrash();
      setItems(list);
    } catch (e) {
      console.warn('TrashScreen.load error', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRestore(id: string) {
    if (processing) return;
    setProcessing(true);
    try {
      const ok = await removeFromTrash(id);
      if (ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        onRestore?.(id);
        Alert.alert('Restaurado', 'Item restaurado com sucesso.');
      } else {
        Alert.alert('Erro', 'Não foi possível restaurar o item.');
      }
    } catch (e) {
      console.warn('handleRestore error', e);
    } finally {
      setProcessing(false);
    }
  }

  async function performBulkDeleteConfirmed() {
    if (processing) return;
    setProcessing(true);
    try {
      const idsToDelete = items.map(i => i.id).filter(Boolean);

      if (idsToDelete.length > 0) {
        try {
          await MediaLibrary.deleteAssetsAsync(idsToDelete);
        } catch (e) {
          console.warn('MediaLibrary.deleteAssetsAsync failed (continuing):', e);
        }
      }

      await clearTrash();
      items.forEach(i => onDeletePermanent?.(i.id));
      setItems([]);
      Alert.alert('Excluídos', 'Itens excluídos permanentemente.');
    } catch (e) {
      console.warn('clearTrash/delete error', e);
      Alert.alert('Erro', 'Não foi possível excluir os itens.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleBulkDelete() {
    if (items.length === 0) {
      Alert.alert('Lixeira vazia', 'Não há itens para excluir.');
      return;
    }

    Alert.alert(
      'Excluir permanentemente',
      `Deseja excluir permanentemente ${items.length} item(s) da lixeira? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (processing) return;
            if (effectivePremium) {
              await performBulkDeleteConfirmed();
              return;
            }
            try {
              await adManager.forceAllowOnce();
              const allowed = await adManager.requestShowAd();
              if (!allowed) {
                Alert.alert('Ad', 'Não foi possível exibir o anúncio agora.');
                return;
              }
              pendingActionRef.current = 'bulkDelete';
              setShowAd(true);
            } catch (e) {
              console.warn('bulkDelete ad flow error', e);
            }
          },
        },
      ]
    );
  }

  async function handleAdClose() {
    setShowAd(false);
    if (pendingActionRef.current === 'bulkDelete') {
      pendingActionRef.current = null;
      await performBulkDeleteConfirmed();
    }
  }

  async function handleAdFinished() {
    setShowAd(false);
    if (pendingActionRef.current === 'bulkDelete') {
      pendingActionRef.current = null;
      await performBulkDeleteConfirmed();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Lixeira</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Itens na lixeira: {effectivePremium ? `${items.length}` : `${items.length}/100`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={{ color: Theme.colors.textSecondary }}>Carregando...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sua lixeira está vazia.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.filename ?? item.id}</Text>
                <Text style={styles.date}>Removido em {new Date(item.deletedAt).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={() => handleRestore(item.id)}
                disabled={processing}
              >
                <Text style={styles.restoreText}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteAllBtn, items.length === 0 && styles.deleteAllDisabled]}
          onPress={handleBulkDelete}
          disabled={items.length === 0 || processing}
        >
          <Text style={styles.deleteAllText}>Excluir Tudo</Text>
        </TouchableOpacity>
      </View>

      <FullscreenVideoAdMock
        visible={showAd}
        duration={15}
        skippableAfter={5}
        onFinished={handleAdFinished}
        onClose={handleAdClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    height: 70,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  back: { color: Theme.colors.primary, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  infoRow: { padding: 24 },
  infoText: { fontWeight: '700', color: Theme.colors.text, fontSize: 16 },
  list: { padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: 12, marginRight: 16 },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 15, color: Theme.colors.text },
  date: { color: Theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  restoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Theme.colors.primaryContainer,
  },
  restoreText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer: { padding: 24, borderTopWidth: 1, borderColor: Theme.colors.border },
  deleteAllBtn: {
    height: 64,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deleteAllDisabled: { opacity: 0.5 },
  deleteAllText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Theme.colors.textSecondary, fontSize: 16 },
});
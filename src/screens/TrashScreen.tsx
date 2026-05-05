// src/screens/TrashScreen.tsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
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
import Theme from '../styles/theme';
import styles from './styles/TrashScreenStyles';

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
              
              // Mostra o intersticial real e AGUARDA ele fechar
              await adManager.showInterstitial();
              
              // Agora o código só prossegue quando o anúncio fechar ou falhar
              await performBulkDeleteConfirmed();

            } catch (e) {
              console.warn('bulkDelete ad flow error', e);
            }
          },
        },
      ]
    );
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
    </SafeAreaView>
  );
}
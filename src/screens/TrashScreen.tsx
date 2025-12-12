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

  // store pending action to run after ad finishes
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
      Alert.alert('Erro', 'Não foi possível restaurar o item.');
    } finally {
      setProcessing(false);
    }
  }

  // função que realmente executa a exclusão em lote (fatorada para chamar após o ad)
  async function performBulkDeleteConfirmed() {
    if (processing) return;
    setProcessing(true);
    try {
      const idsToDelete = items.map(i => i.id).filter(Boolean);

      if (idsToDelete.length > 0) {
        try {
          const result = await MediaLibrary.deleteAssetsAsync(idsToDelete);
          console.log('MediaLibrary.deleteAssetsAsync result:', result);
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

  // fluxo ao confirmar exclusão: se premium -> exclui direto.
  // se não for premium -> exibe ad (forçando override) e só após fechar o ad executa exclusão.
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

            // premium => exclui imediatamente
            if (effectivePremium) {
              await performBulkDeleteConfirmed();
              return;
            }

            // não premium => mostrar ad antes de excluir
            try {
              // Forçar que a próxima requisição de ad seja permitida (ignora cooldown uma vez)
              await adManager.forceAllowOnce();

              // requestShowAd() já marca lastShown + nextAllowed se retornar true
              const allowed = await adManager.requestShowAd();
              if (!allowed) {
                // não permitido por algum motivo (premiumLoading ou erro)
                Alert.alert('Ad', 'Não foi possível exibir o anúncio agora. Tente novamente mais tarde.');
                return;
              }

              // marca ação pendente e abre o mock ad
              pendingActionRef.current = 'bulkDelete';
              setShowAd(true);
            } catch (e) {
              console.warn('bulkDelete ad flow error', e);
              Alert.alert('Erro', 'Não foi possível iniciar o fluxo de anúncios.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  // handlers para o mock ad
  async function handleAdClose(reason?: string) {
    setShowAd(false);
    // se tivermos uma ação pendente, execute-a
    if (pendingActionRef.current === 'bulkDelete') {
      pendingActionRef.current = null;
      // executa exclusão após fechar ad
      await performBulkDeleteConfirmed();
    }
  }

  async function handleAdFinished() {
    // ad terminou naturalmente; devemos fechar o modal e executar ação
    setShowAd(false);
    if (pendingActionRef.current === 'bulkDelete') {
      pendingActionRef.current = null;
      await performBulkDeleteConfirmed();
    }
  }

  function handleAddSpace() {
    if (onAddSpace) {
      onAddSpace();
    } else {
      Alert.alert(
        'Adicionar espaço',
        'Opções para aumentar o espaço da lixeira serão oferecidas (doação / assistir anúncio).'
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Lixeira</Text>

        {!effectivePremium ? (
          <TouchableOpacity onPress={handleAddSpace}>
            <Text style={styles.addSpace}>Adicionar espaço</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 120 }} />
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Itens na lixeira: {effectivePremium ? `${items.length}` : `${items.length}/100`}
        </Text>
        <Text style={styles.infoHint}>Restaurar itens individualmente, excluir em lote abaixo.</Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text>Carregando...</Text>
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
                <Text style={styles.name}>{item.filename ?? item.id}</Text>
                <Text style={styles.date}>Removido: {new Date(item.deletedAt).toLocaleString()}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={() => handleRestore(item.id)}
                  disabled={processing}
                >
                  <Text style={styles.restoreText}>Restaurar</Text>
                </TouchableOpacity>
              </View>
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
          <Text style={[styles.deleteAllText, items.length === 0 && styles.deleteAllTextDisabled]}>
            Excluir {effectivePremium ? `${items.length}` : `${items.length}/100`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen mock ad */}
      <FullscreenVideoAdMock
        visible={showAd}
        duration={15}
        skippableAfter={5}
        onShown={() => console.log('mock ad shown')}
        onFinished={handleAdFinished}
        onClose={() => handleAdClose('closed')}
      />
    </SafeAreaView>
  );
}

const THUMB = 64;
const PADDING = 16;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 64,
    paddingHorizontal: PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  back: { color: '#0b63d6', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700' },
  addSpace: { color: '#0b63d6', fontSize: 14, fontWeight: '600' },

  infoRow: {
    paddingHorizontal: PADDING,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#f1f5f9',
    backgroundColor: '#fbfdff',
  },
  infoText: { fontWeight: '700', color: '#333' },
  infoHint: { marginTop: 6, color: '#666', fontSize: 13 },

  list: { padding: PADDING },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 15 },
  date: { color: '#777', marginTop: 6, fontSize: 13 },
  actions: { flexDirection: 'column' },

  restoreBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#2f9e44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: { color: '#fff', fontWeight: '700' },

  footer: {
    padding: PADDING,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
  },
  deleteAllBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ff4d4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAllDisabled: { backgroundColor: '#ffecec' },
  deleteAllText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  deleteAllTextDisabled: { color: '#ff9b9b' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
});
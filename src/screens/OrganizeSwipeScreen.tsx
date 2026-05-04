// src/screens/OrganizeSwipeScreen.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import styles from '../styles/swipeStylesOrganize';
import SwipeDeck, { SwipeDeckHandle, Item as DeckItem } from '../components/SwipeDeck';
import { PremiumContext } from '../context/PremiumContext';
import Theme from '../styles/theme';
import { useUndoOrganize } from '../hooks/useUndoOrganize';
import { useResetGallery } from '../hooks/useResetGallery';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;
const CARD_OFFSET = 12;
const VISIBLE_CARDS = 2;
const FALLBACK_URI =
  'https://img.freepik.com/vetores-gratis/ilustracao-de-galeria-icone_53876-27002.jpg?semt=ais_se_enriched&w=740&q=80';
const PAGE_SIZE = 40;
const STORAGE_LAST_ID = '@organize_last_id';
const UNDO_LIMIT = 5;

type Props = {
  onBack: () => void;
  mediaType?: MediaLibrary.MediaTypeValue[];
};

type Item = { id: string; uri: string; filename?: string };
type Action = { type: 'moved' | 'created' | 'left' | 'right'; item: Item; albumId?: string };
type AlbumInfo = { id: string; title: string; count: number; thumbnailUri?: string | null };

export default function OrganizeSwipeScreen({ onBack, mediaType = ['photo'] }: Props) {
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? false : isPremium;

  const [items, setItems] = useState<Item[]>([]);
  const [albums, setAlbums] = useState<AlbumInfo[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [actionStack, setActionStack] = useState<Action[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true);

  // pagination states
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // create album modal & mode
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>('');
  const [creatingAlbum, setCreatingAlbum] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<boolean>(false);
  const [candidateAsset, setCandidateAsset] = useState<Item | null>(null);

  // refs
  const isFetchingRef = useRef<boolean>(false);
  const loadedIdsRef = useRef<Set<string>>(new Set<string>());
  const swipeDeckRef = useRef<SwipeDeckHandle | null>(null);

  // hooks
  const positionRefForHook = useRef({ x: 0, y: 0 });
  const [, setPosForHook] = useState({ x: 0, y: 0 });

  const { handleUndo } = useUndoOrganize({
    actionStack,
    setActionStack,
    setItems,
    setAlbums,
    positionRef: positionRefForHook,
    setPos: setPosForHook,
  });

  const { handleResetGallery } = useResetGallery({
    effectivePremium,
    setLoading,
    setItems,
    setEndCursor,
    setHasNextPage,
    trashIds: {},
  });

  // initial load
  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      setLoading(true);
      try {
        const p = await MediaLibrary.requestPermissionsAsync();
        if (p.status !== 'granted') {
          if (!mounted) return;
          setItems([]);
          Alert.alert(
            'Permissão necessária',
            'Permita o acesso às fotos para carregar suas imagens.'
          );
          return;
        }

        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          mediaType,
          sortBy: ['creationTime'],
        });
        if (!mounted) return;

        const mappedAll = (page.assets ?? []).map((a: any) => ({
          id: a.id,
          uri: a.uri,
          filename: a.filename ?? undefined,
        }));
        let mapped = mappedAll;

        try {
          const lastId = await AsyncStorage.getItem(STORAGE_LAST_ID);
          if (lastId) {
            const idx = mapped.findIndex(i => i.id === lastId);
            if (idx >= 0 && mapped.length > 0) {
              mapped = [...mapped.slice(idx), ...mapped.slice(0, idx)];
            }
          }
        } catch (e) {}

        setItems(mapped);
        setEndCursor(page.endCursor ?? null);
        setHasNextPage(Boolean((page as any).hasNextPage));

        try {
          const meta = await MediaLibrary.getAssetsAsync({ first: 1, mediaType });
          if ((meta as any).totalCount != null) setTotalAssets((meta as any).totalCount);
        } catch {}
      } catch (err) {
        console.warn('Erro carregando assets (organize):', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();
    loadAlbumsWithThumbs();
    return () => {
      mounted = false;
    };
  }, [effectivePremium]);

  async function loadAlbumsWithThumbs(silent: boolean = false) {
    if (!silent) setAlbumsLoading(true);
    try {
      const albumsList = await MediaLibrary.getAlbumsAsync();
      const albumInfos: AlbumInfo[] = await Promise.all(
        albumsList.map(async (alb: any) => {
          try {
            const assetsPage = await MediaLibrary.getAssetsAsync({
              first: 1,
              album: alb.id,
              mediaType,
              sortBy: ['creationTime'],
            });
            const asset = assetsPage.assets && assetsPage.assets.length > 0 ? assetsPage.assets[0] : null;
            const countFromAssets = (assetsPage as any).totalCount ?? alb.assetCount ?? 0;
            return { id: alb.id, title: alb.title, count: countFromAssets, thumbnailUri: asset?.uri ?? null };
          } catch (e) {
            return { id: alb.id, title: alb.title, count: alb.assetCount ?? 0, thumbnailUri: null };
          }
        })
      );
      setAlbums(albumInfos);
    } catch (err) {
      console.warn('Erro carregando albums:', err);
    } finally {
      if (!silent) setAlbumsLoading(false);
    }
  }

  async function loadNext50OrLess() {
    if (!hasNextPage && !endCursor) return;
    setLoading(true);
    try {
      const page = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: endCursor ?? undefined,
        mediaType,
        sortBy: ['creationTime'],
      });

      const mappedAll = (page.assets ?? []).map((a: any) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename ?? undefined,
      }));
      setItems(prev => {
        const existing = new Set(prev.map(p => p.id));
        const toAppend = mappedAll.filter((m: Item) => !existing.has(m.id));
        return [...prev, ...toAppend];
      });

      setEndCursor(page.endCursor ?? null);
      setHasNextPage(Boolean((page as any).hasNextPage));
    } catch (err) {
      console.warn('Erro loadNext (organize):', err);
    } finally {
      setLoading(false);
    }
  }

  async function createAlbumWithAsset(name: string, asset: Item) {
    if (!name || name.trim().length === 0) {
      Alert.alert('Nome inválido', 'Informe um nome válido para o álbum.');
      return;
    }

    try {
      setCreatingAlbum(true);
      const created = await MediaLibrary.createAlbumAsync(name.trim(), asset.id, false);

      let albumId: string | undefined;
      if (created && typeof created === 'object' && (created as any).id) albumId = (created as any).id;
      else if (typeof created === 'string') albumId = created;

      if (!albumId) {
        const all = await MediaLibrary.getAlbumsAsync();
        const found = all.find(a => a.title === name.trim());
        albumId = found?.id;
      }

      await loadAlbumsWithThumbs(true);

      setShowCreateModal(false);
      setNewAlbumName('');
      setCreateMode(false);
      setCandidateAsset(null);

      setItems(prev => prev.filter(i => i.id !== asset.id));
      setActionStack(prev => [{ type: 'created', item: asset, albumId: albumId }, ...prev].slice(0, UNDO_LIMIT));

      Alert.alert('Álbum criado', `Álbum "${name.trim()}" criado com sucesso.`);
    } catch (err) {
      console.warn('Erro criando álbum:', err);
      Alert.alert('Erro', 'Não foi possível criar o álbum.');
    } finally {
      setCreatingAlbum(false);
    }
  }

  async function moveAssetToAlbum(asset: Item, albumId: string) {
    try {
      await MediaLibrary.addAssetsToAlbumAsync([asset.id], albumId, false);
      
      setAlbums(prev => prev.map(a => {
        if (a.id === albumId) {
          return { ...a, count: (a.count ?? 0) + 1, thumbnailUri: a.thumbnailUri ?? asset.uri };
        }
        return a;
      }));

      setItems(prev => {
        const rest = prev.filter(i => i.id !== asset.id);
        if (rest.length <= 5 && hasNextPage && !isFetchingRef.current) {
          isFetchingRef.current = true;
          loadNext50OrLess().finally(() => {
            isFetchingRef.current = false;
          });
        }
        return rest;
      });

      return true;
    } catch (e) {
      console.warn('moveAssetToAlbum failed:', e);
      Alert.alert('Erro', 'Não foi possível mover a foto para o álbum.');
      return false;
    }
  }

  async function onSwipeCompleteHandler(direction: 'left' | 'right', item: DeckItem) {
    if (!item) return;

    if (createMode && direction === 'right') {
      setCandidateAsset(item as Item);
      setShowCreateModal(true);
      return;
    }

    if (direction === 'right') {
      if (!selectedAlbumId) {
        Alert.alert('Selecione um álbum', 'Selecione um álbum abaixo antes de deslizar para a direita.');
        swipeDeckRef.current?.resetPosition();
        return;
      }

      const ok = await moveAssetToAlbum(item as Item, selectedAlbumId);
      if (ok) {
        setActionStack(prev => [{ type: 'moved', item: item as Item, albumId: selectedAlbumId }, ...prev].slice(0, UNDO_LIMIT));
      }
      return;
    }

    // left swipe
    setActionStack(prev => [{ type: 'left', item: item as Item }, ...prev].slice(0, UNDO_LIMIT));
    setItems(prev => {
      const rest = prev.filter(i => i.id !== item.id);
      if (rest.length <= 5 && hasNextPage && !isFetchingRef.current) {
        isFetchingRef.current = true;
        loadNext50OrLess().finally(() => {
          isFetchingRef.current = false;
        });
      }
      return rest;
    });
  }

  async function saveStateAndBack() {
    try {
      const top = items[0];
      if (top && top.id) await AsyncStorage.setItem(STORAGE_LAST_ID, top.id);
      else await AsyncStorage.removeItem(STORAGE_LAST_ID);
    } catch (e) {
    } finally {
      onBack();
    }
  }

  function toggleSelectAlbum(id: string) {
    setSelectedAlbumId(prev => (prev === id ? null : id));
  }

  function renderDeckArea() {
    if (loading && items.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      );
    }

    if (!loading && items.length === 0 && !hasNextPage) {
      return (
        <View style={styles.finalCardWrap}>
          <View style={styles.finalCard}>
            <View style={styles.finalIconBox}>
              <Ionicons name="checkmark-circle" size={48} color={Theme.colors.primary} />
            </View>
            <Text style={styles.finalTitle}>Organização Concluída</Text>
            <Text style={styles.finalBody}>Sua biblioteca está devidamente organizada.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
              <Text style={styles.primaryBtnText}>Voltar para Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <SwipeDeck
        ref={swipeDeckRef}
        items={items as DeckItem[]}
        visibleCards={VISIBLE_CARDS}
        cardOffset={CARD_OFFSET}
        fallbackUri={FALLBACK_URI}
        failedImages={failedImages}
        swipeThreshold={SWIPE_THRESHOLD}
        onSwipe={onSwipeCompleteHandler}
        onImageLoad={(id) => loadedIdsRef.current.add(id)}
        onImageError={(id) => setFailedImages(prev => ({ ...prev, [id]: true }))}
        deckStyles={styles}
        isVideoDeck={mediaType.includes('video')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={saveStateAndBack}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleUndo} disabled={actionStack.length === 0}>
          <Text style={[styles.undo, actionStack.length === 0 && { opacity: 0.4 }]}>Desfazer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deckWrap}>
        {renderDeckArea()}

        <View style={styles.albumsSection}>
          <View style={styles.albumsHeaderRow}>
            <Text style={styles.albumsTitle}>Álbuns</Text>

            <TouchableOpacity onPress={() => setCreateMode(!createMode)} style={styles.createAlbumBtn}>
              <Text style={createMode ? styles.createAlbumBtnTextOn : styles.createAlbumBtnText}>
                {createMode ? 'Criar: ligado' : '+ Criar álbum'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.albumsScrollWrap}>
            {albumsLoading ? (
              <ActivityIndicator color={Theme.colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumsScrollContent}>
                {albums.map(album => {
                  const selected = album.id === selectedAlbumId;
                  return (
                    <TouchableOpacity key={album.id} onPress={() => toggleSelectAlbum(album.id)} style={styles.albumItem} activeOpacity={0.8}>
                      <View style={[styles.albumThumbWrap, selected && styles.albumThumbWrapSelected]}>
                        {album.thumbnailUri ? (
                          <Image source={{ uri: album.thumbnailUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <Text style={{ color: Theme.colors.textMuted }}>DIR</Text>
                        )}
                      </View>
                      <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                      <Text style={styles.albumCount}>{album.count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      <Modal visible={showCreateModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalInner}>
            <Text style={styles.modalHeading}>Criar novo álbum</Text>

            {candidateAsset && (
              <View style={styles.modalAssetPreviewWrap}>
                <Image source={{ uri: candidateAsset.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            )}

            <TextInput
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              placeholder="Nome do álbum"
              placeholderTextColor={Theme.colors.textMuted}
              style={styles.modalTextInput}
              autoFocus
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setNewAlbumName(''); setCreateMode(false); setCandidateAsset(null); }}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => candidateAsset && createAlbumWithAsset(newAlbumName, candidateAsset)}
                disabled={creatingAlbum}
              >
                <Text style={styles.modalCreateText}>{creatingAlbum ? 'Criando...' : 'Criar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View style={styles.hint}>
        <Text style={styles.hintText}>Organize seu acervo em álbuns</Text>
        <Text style={styles.hintTextSmall}>ESQUERDA: PULAR  •  DIREITA: MOVER PARA ÁLBUM</Text>
      </View>
    </SafeAreaView>
  );
}
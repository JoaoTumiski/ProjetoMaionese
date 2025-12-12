// src/screens/OrganizeSwipeScreen.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import styles from '../styles/swipeStylesOrganize';
import { useUndoOrganize } from '../hooks/useUndoOrganize';
import { useResetGallery } from '../hooks/useResetGallery';
import SwipeDeck, { SwipeDeckHandle, Item as DeckItem } from '../components/SwipeDeckOrganize';
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
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PremiumContext } from '../context/PremiumContext';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;
const CARD_OFFSET = 12;
const VISIBLE_CARDS = 3;
const FALLBACK_URI =
  'https://img.freepik.com/vetores-gratis/ilustracao-de-galeria-icone_53876-27002.jpg?semt=ais_se_enriched&w=740&q=80';
const PAGE_SIZE = 50;

const STORAGE_LAST_ID = '@organize_last_id';
const UNDO_LIMIT = 5;

type Props = { onBack: () => void };

type Item = { id: string; uri: string; filename?: string };
type Action = { type: 'left' | 'right' | 'moved' | 'created'; item: Item; albumId?: string };

type AlbumInfo = { id: string; title: string; count: number; thumbnailUri?: string | null };

export default function OrganizeSwipeScreen({ onBack }: Props) {
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? false : isPremium;

  // --- state
  const [items, setItems] = useState<Item[]>([]);
  const [actionStack, setActionStack] = useState<Action[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);

  // albums
  const [albums, setAlbums] = useState<AlbumInfo[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true);

  // create album modal & mode
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>('');
  const [creatingAlbum, setCreatingAlbum] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<boolean>(false);
  const [candidateAsset, setCandidateAsset] = useState<Item | null>(null);

  // selected album
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // refs
  const isFetchingRef = useRef<boolean>(false);
  const loadedIdsRef = useRef<Set<string>>(new Set<string>());
  const swipeDeckRef = useRef<SwipeDeckHandle | null>(null);

  // initial load (respects last id)
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
            'Permita o acesso às fotos nas configurações para carregar suas imagens. Usando placeholders para teste.'
          );
          return;
        }

        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });
        if (!mounted) return;

        const mappedAll = (page.assets ?? []).map((a: any) => ({ id: a.id, uri: a.uri, filename: a.filename ?? undefined }));
        let mapped = mappedAll;

        try {
          const lastId = await AsyncStorage.getItem(STORAGE_LAST_ID);
          if (lastId) {
            const idx = mapped.findIndex(i => i.id === lastId);
            if (idx >= 0 && mapped.length > 0) {
              mapped = [...mapped.slice(idx), ...mapped.slice(0, idx)];
            }
          }
        } catch (e) {
          console.warn('could not read lastId', e);
        }

        setItems(mapped);
        setEndCursor(page.endCursor ?? null);
        setHasNextPage(Boolean((page as any).hasNextPage));

        try {
          const meta = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: ['photo'] });
          if ((meta as any).totalCount != null) setTotalAssets((meta as any).totalCount);
        } catch {}
      } catch (err) {
        console.warn('Erro carregando assets (organize):', err);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [effectivePremium]);

  // albums loader
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
              mediaType: ['photo'],
              sortBy: ['creationTime'],
            });
            const asset = assetsPage.assets && assetsPage.assets.length > 0 ? assetsPage.assets[0] : null;
            const countFromAssets = (assetsPage as any).totalCount ?? alb.assetCount ?? 0;
            return { id: alb.id, title: alb.title, count: countFromAssets, thumbnailUri: asset?.uri ?? null } as AlbumInfo;
          } catch (e) {
            return { id: alb.id, title: alb.title, count: alb.assetCount ?? 0, thumbnailUri: null } as AlbumInfo;
          }
        })
      );
      setAlbums(albumInfos);
    } catch (err) {
      console.warn('Erro carregando albums:', err);
      setAlbums([]);
    } finally {
      if (!silent) setAlbumsLoading(false);
    }
  }

  useEffect(() => {
    loadAlbumsWithThumbs();
  }, []);

  // create album with asset
  async function createAlbumWithAsset(name: string, asset: Item) {
    if (!name || name.trim().length === 0) {
      Alert.alert('Nome inválido', 'Informe um nome válido para o álbum.');
      return false;
    }

    try {
      setCreatingAlbum(true);
      const created = await MediaLibrary.createAlbumAsync(name.trim(), asset.uri, false);

      let albumId: string | undefined;
      if (created && typeof created === 'object' && (created as any).id) albumId = (created as any).id;
      else if (typeof created === 'string') albumId = created;

      if (!albumId) {
        const all = await MediaLibrary.getAlbumsAsync();
        const found = all.find(a => a.title === name.trim());
        albumId = found?.id;
      }

      if (albumId) {
        try {
          await MediaLibrary.addAssetsToAlbumAsync([asset.id], albumId, false);
        } catch (e) {
          console.warn('addAssetsToAlbumAsync failed (maybe already added):', e);
        }
      } else {
        console.warn('Could not determine albumId after createAlbumAsync');
      }

      await new Promise(res => setTimeout(res, 700));
      await loadAlbumsWithThumbs(true);

      setShowCreateModal(false);
      setNewAlbumName('');
      setCreateMode(false);
      setCandidateAsset(null);

      setItems(prev => prev.filter(i => i.id !== asset.id));
      setActionStack(prev => [{ type: 'created', item: asset, albumId: albumId ?? undefined }, ...prev].slice(0, UNDO_LIMIT));

      Alert.alert('Álbum criado', `Álbum "${name.trim()}" criado com sucesso.`);
      return true;
    } catch (err) {
      console.warn('Erro criando álbum:', err);
      Alert.alert('Erro', 'Não foi possível criar o álbum. Verifique permissões e tente novamente.');
      return false;
    } finally {
      setCreatingAlbum(false);
    }
  }

  // save state & back
  async function saveStateAndBack() {
    try {
      const top = items[0];
      if (top && top.id) await AsyncStorage.setItem(STORAGE_LAST_ID, top.id);
      else await AsyncStorage.removeItem(STORAGE_LAST_ID);
    } catch (e) {
      console.warn('saveState error (organize)', e);
    } finally {
      onBack();
    }
  }

  // confirm restart
  function confirmResetGallery() {
    Alert.alert(
      'Reiniciar galeria',
      'Isso reiniciará a galeria e perderá a posição atual. A revisão voltará para a PRIMEIRA foto. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_LAST_ID);
            } catch (e) {
              console.warn('failed clearing lastId', e);
            }
            handleResetGallery();
          },
        },
      ]
    );
  }

  // pagination
  async function loadNext50OrLess() {
    if (!hasNextPage && !endCursor) return;
    setLoading(true);
    try {
      const loadedCount = items.length;
      const remaining = totalAssets != null ? Math.max(0, totalAssets - loadedCount) : PAGE_SIZE;
      const toFetch = Math.min(PAGE_SIZE, Math.max(1, remaining));
      const page = await MediaLibrary.getAssetsAsync({
        first: toFetch,
        after: endCursor ?? undefined,
        mediaType: ['photo'],
        sortBy: ['creationTime'],
      });

      const mappedAll = (page.assets ?? []).map((a: any) => ({ id: a.id, uri: a.uri, filename: a.filename ?? undefined }));
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

  // image handlers
  function handleImageError(id: string) {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  }
  function handleImageLoad(id: string) {
    loadedIdsRef.current.add(id);
  }

  // move to album optimistic
  async function moveAssetToAlbum(asset: Item, albumId: string) {
    try {
      await MediaLibrary.addAssetsToAlbumAsync([asset.id], albumId, false);
    } catch (e) {
      console.warn('moveAssetToAlbum failed:', e);
      Alert.alert('Erro', 'Não foi possível mover a foto para o álbum.');
      return false;
    }

    setAlbums(prev => {
      let found = false;
      const next = prev.map(a => {
        if (a.id === albumId) {
          found = true;
          return { ...a, count: (a.count ?? 0) + 1, thumbnailUri: a.thumbnailUri ?? asset.uri };
        }
        return a;
      });
      if (!found) {
        next.unshift({ id: albumId, title: 'Album', count: 1, thumbnailUri: asset.uri } as AlbumInfo);
      }
      return next;
    });

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

    setTimeout(() => {
      loadAlbumsWithThumbs(true).catch(err => console.warn('silent albums reload failed', err));
    }, 900);

    return true;
  }

  // swipe handler
  async function onSwipeCompleteHandler(direction: 'left' | 'right', item: DeckItem) {
    if (!item) return;

    if (createMode && direction === 'right') {
      setCandidateAsset(item);
      setShowCreateModal(true);
      return;
    }

    if (direction === 'right') {
      if (!selectedAlbumId) {
        Alert.alert(
          'Selecione um álbum',
          'Para mover uma foto para um álbum, primeiro selecione um álbum abaixo. Toque no quadrado do álbum para selecioná-lo e depois deslize a foto para a direita.'
        );
        return;
      }

      const ok = await moveAssetToAlbum(item, selectedAlbumId);
      if (ok) {
        setActionStack(prev => [{ type: 'moved', item, albumId: selectedAlbumId }, ...prev].slice(0, UNDO_LIMIT));
        setCreateMode(false);
      }
      return;
    }

    const action: Action = { type: direction, item };
    setActionStack(prev => {
      const next = [action, ...prev];
      return next.slice(0, UNDO_LIMIT);
    });

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

  // undo hook (organize-aware)
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

  // reset gallery hook
  const { handleResetGallery } = useResetGallery({
    effectivePremium,
    setLoading,
    setItems,
    setEndCursor,
    setHasNextPage,
    trashIds: {},
  });

  // create mode activation
  function handleActivateCreateMode() {
    setCreateMode(true);
    Alert.alert(
      'Criar álbum',
      'Deslize para a direita UMA foto para usar como imagem principal do novo álbum. Após deslizar, você poderá digitar o nome do álbum.',
      [{ text: 'Ok' }]
    );
  }

  function toggleSelectAlbum(id: string) {
    setSelectedAlbumId(prev => (prev === id ? null : id));
  }

  // render deck area
  function renderDeckArea() {
    if (loading && items.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (!loading && items.length === 0 && !hasNextPage) {
      return (
        <View style={[styles.finalCardWrap, { transform: [{ translateY: 0 }] }]}>
          <View style={styles.finalCard}>
            <Text style={styles.finalTitle}>No more photos to organize</Text>
            <Text style={styles.finalBody}>You finished reviewing your library. You can restart the organize flow to review again.</Text>

            <View style={styles.finalActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={confirmResetGallery}>
                <Text style={styles.primaryBtnText}>Restart</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.ghostBtn} onPress={() => { onBack(); }}>
                <Text style={styles.ghostBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
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
        onSwipe={(direction, item) => onSwipeCompleteHandler(direction, item)}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={saveStateAndBack}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRightRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={confirmResetGallery}>
            <Text style={styles.primaryBtnText}>Restart</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleUndo} disabled={actionStack.length === 0}>
          <Text style={[styles.undo, actionStack.length === 0 && { opacity: 0.4 }]}>Undo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deckWrap}>
        {renderDeckArea()}

        {/* Albums row */}
        <View style={styles.albumsSection}>
          <View style={styles.albumsHeaderRow}>
            <Text style={styles.albumsTitle}>Albums</Text>

            <TouchableOpacity onPress={handleActivateCreateMode} style={styles.createAlbumBtn}>
              <Text style={createMode ? styles.createAlbumBtnTextOn : styles.createAlbumBtnText}>
                {createMode ? 'Criar: ligado' : '+ Criar álbum'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.albumsScrollWrap}>
            {albumsLoading ? (
              <View style={{ paddingHorizontal: 20 }}>
                <ActivityIndicator />
              </View>
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
                          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#888' }}>—</Text>
                          </View>
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

      {/* Create album modal */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => { setShowCreateModal(false); setCreateMode(false); setCandidateAsset(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalInner}>
            <Text style={styles.modalHeading}>Create new album</Text>

            {candidateAsset ? (
              <View style={styles.modalAssetPreviewWrap}>
                <Image source={{ uri: candidateAsset.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            ) : null}

            <TextInput
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              placeholder="Album name"
              placeholderTextColor={'#999'}
              style={styles.modalTextInput}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setNewAlbumName(''); setCreateMode(false); setCandidateAsset(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!candidateAsset) {
                    Alert.alert('Sem foto', 'Nenhuma foto selecionada para criar o álbum.');
                    return;
                  }
                  createAlbumWithAsset(newAlbumName, candidateAsset);
                }}
                disabled={creatingAlbum}
                style={{ marginLeft: 12 }}
              >
                <Text style={styles.modalCreateText}>{creatingAlbum ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
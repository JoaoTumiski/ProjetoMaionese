// src/screens/SwipeScreen.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import styles, { } from '../styles/swipeStyles';
import { useUndo } from '../hooks/useUndo';
import { useResetGallery } from '../hooks/useResetGallery';
import SwipeDeck, { SwipeDeckHandle, Item as DeckItem } from '../components/SwipeDeck';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToTrash, getTrash, setPremiumFlag, TrashItem } from '../storage/trashStore';
import { PremiumContext } from '../context/PremiumContext';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;
const CARD_OFFSET = 12;
const VISIBLE_CARDS = 3;
const FALLBACK_URI = 'https://img.freepik.com/vetores-gratis/ilustracao-de-galeria-icone_53876-27002.jpg?semt=ais_se_enriched&w=740&q=80';
const PAGE_SIZE = 50;

const STORAGE_LAST_ID = '@swipe_last_id';
const STORAGE_SHUFFLED = '@swipe_shuffled';
const UNDO_LIMIT = 5;

type Props = {
  onBack: () => void;
  onKeep?: (item: any) => void;
  onTrash?: (item: any) => void;
  donationActive?: boolean; // fallback while context loads
};

type Item = { id: string; uri: string; filename?: string };
type Action = { type: 'keep' | 'trash'; item: Item };

export default function SwipeScreen({
  onBack,
  onKeep,
  onTrash,
  donationActive = false,
}: Props) {
  // premium
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? donationActive : isPremium;

  // state
  const [items, setItems] = useState<Item[]>([]);
  const [trashedCount, setTrashedCount] = useState<number>(0);
  const [actionStack, setActionStack] = useState<Action[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [trashIds, setTrashIds] = useState<Record<string, boolean>>({});
  const [shuffled, setShuffled] = useState<boolean>(!Boolean(donationActive));

  const isFetchingRef = useRef<boolean>(false);

  // final card pan (pure state, no animation)
  const finalPanRef = useRef({ y: 0 });
  const [finalPanY, setFinalPanY] = useState(0);

  // shuffle util (kept for non-premium flows)
  function shuffleArray<T>(arr: T[]) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // persist premium flag & shuffled default
  useEffect(() => {
    (async () => {
      try {
        await setPremiumFlag(Boolean(effectivePremium));
        setShuffled(!Boolean(effectivePremium));
        await AsyncStorage.setItem(STORAGE_SHUFFLED, !effectivePremium ? '1' : '0');
      } catch (e) {
        console.warn('persist premium flag failure', e);
      }
    })();
  }, [effectivePremium]);

  // --- LOAD INICIAL:
  useEffect(() => {
    let mounted = true;
    async function loadInitialCombined() {
      setLoading(true);
      try {
        const list = await getTrash();
        if (!mounted) return;
        const map: Record<string, boolean> = {};
        list.forEach(i => (map[i.id] = true));
        setTrashIds(map);
        setTrashedCount(list.length);

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
        let mapped = mappedAll.filter(a => !map[a.id]);

        const lastId = await AsyncStorage.getItem(STORAGE_LAST_ID);

        if (!effectivePremium) {
          let shuffledPage = shuffleArray(mapped);
          if (lastId) {
            const idx = shuffledPage.findIndex(i => i.id === lastId);
            if (idx >= 0) {
              shuffledPage = [...shuffledPage.slice(idx), ...shuffledPage.slice(0, idx)];
            }
          }
          setItems(shuffledPage);
          setShuffled(true);
          setEndCursor(page.endCursor ?? null);
          setHasNextPage(Boolean((page as any).hasNextPage));
        } else {
          if (lastId) {
            const idx = mapped.findIndex(i => i.id === lastId);
            if (idx >= 0 && mapped.length > 0) {
              mapped = [...mapped.slice(idx), ...mapped.slice(0, idx)];
            }
          }
          setItems(mapped);
          setEndCursor(page.endCursor ?? null);
          setHasNextPage(Boolean((page as any).hasNextPage));
        }

        try {
          const meta = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: ['photo'] });
          if ((meta as any).totalCount != null) setTotalAssets((meta as any).totalCount);
        } catch {}
      } catch (err) {
        console.warn('Erro carregando assets:', err);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialCombined();
    return () => {
      mounted = false;
    };
  }, [effectivePremium]);

  // salvar top id e shuffle flag ao sair
  async function saveStateAndBack() {
    try {
      const top = items[0];
      if (top && top.id) {
        await AsyncStorage.setItem(STORAGE_LAST_ID, top.id);
      } else {
        await AsyncStorage.removeItem(STORAGE_LAST_ID);
      }
      await AsyncStorage.setItem(STORAGE_SHUFFLED, shuffled ? '1' : '0');
    } catch (e) {
      console.warn('saveState error', e);
    } finally {
      onBack();
    }
  }

  // calcula total disponível
  function totalAvailableCount() {
    if (totalAssets == null) return null;
    const available = Math.max(0, totalAssets - Object.keys(trashIds).length);
    return available;
  }

  // load next
  async function loadNext50OrLess() {
    if (!hasNextPage && !endCursor) return;

    setLoading(true);
    try {
      const loadedCount = items.length;
      const available = totalAvailableCount();
      let toFetch = PAGE_SIZE;
      if (available != null) {
        const remaining = Math.max(0, available - loadedCount);
        if (remaining <= 0) {
          setHasNextPage(false);
          return;
        }
        toFetch = Math.min(PAGE_SIZE, remaining);
      }

      const page = await MediaLibrary.getAssetsAsync({
        first: toFetch,
        after: endCursor ?? undefined,
        mediaType: ['photo'],
        sortBy: ['creationTime'],
      });

      const mappedAll = (page.assets ?? []).map((a: any) => ({ id: a.id, uri: a.uri, filename: a.filename ?? undefined }));
      const filtered = mappedAll.filter((a: Item) => !trashIds[a.id]);

      setItems(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        let toAppend = filtered.filter(i => !existingIds.has(i.id));
        if (!effectivePremium && toAppend.length > 1) {
          toAppend = shuffleArray(toAppend);
        }
        return [...prev, ...toAppend];
      });

      setEndCursor(page.endCursor ?? null);
      setHasNextPage(Boolean((page as any).hasNextPage));
    } catch (err) {
      console.warn('Erro loadNext50OrLess:', err);
    } finally {
      setLoading(false);
    }
  }

  // loadAllRemaining (util)
  async function loadAllRemaining() {
    setLoading(true);
    try {
      let cursor = endCursor;
      let collected: Item[] = [];
      while (true) {
        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          after: cursor ?? undefined,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });
        const mappedAll = (page.assets ?? []).map((a: any) => ({ id: a.id, uri: a.uri, filename: a.filename ?? undefined }));
        const filtered = mappedAll.filter((a: Item) => !trashIds[a.id]);
        collected = [...collected, ...filtered];
        if (!(page as any).hasNextPage) {
          setEndCursor(page.endCursor ?? null);
          setHasNextPage(false);
          break;
        }
        cursor = page.endCursor ?? null;
      }
      setItems(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const toAppend = collected.filter(i => !existingIds.has(i.id));
        return [...prev, ...toAppend];
      });
      Alert.alert('Concluído', `Carregadas ${collected.length} imagens adicionais.`);
    } catch (err) {
      console.warn('Erro em loadAllRemaining:', err);
      Alert.alert('Erro', 'Não foi possível carregar todas as imagens.');
    } finally {
      setLoading(false);
    }
  }

  const positionRefForHook = useRef({ x: 0, y: 0 });
  const [, setPosForHook] = useState({ x: 0, y: 0 });

  const { handleUndo } = useUndo({
    actionStack,
    setActionStack,
    setTrashIds,
    setTrashedCount,
    setItems,
    positionRef: positionRefForHook,
    setPos: setPosForHook,
  });

  const { handleResetGallery } = useResetGallery({
    effectivePremium,
    setLoading,
    setShuffled,
    setItems,
    setEndCursor,
    setHasNextPage,
    trashIds,
  });

  // image handlers (no fade)
  function handleImageError(id: string) {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  }

  function handleImageLoad(id: string) {
    // mark loaded (keeps parity with previous implementation)
    // small tick not strictly needed now, but we keep behavior similar
    // to avoid unintended regressions if other code depends on loadedIdsRef
    // (e.g. tests or conditional logic).
    // We still keep loadedIdsRef to preserve previous semantics.
    // (Note: loadedIdsRef exists earlier in original code but not used elsewhere here)
    // We'll add and update it here:
    // @ts-ignore - loadedIdsRef defined below
    loadedIdsRef.current.add(id);
  }

  // keep loadedIdsRef for parity
  const loadedIdsRef = useRef<Set<string>>(new Set<string>());

  // SwipeDeck ref (optional)
  const swipeDeckRef = useRef<SwipeDeckHandle | null>(null);

  // onSwipeCompleteHandler: same logic as original onSwipeComplete but accepts (direction, item)
  async function onSwipeCompleteHandler(direction: 'left' | 'right', item: DeckItem) {
    if (!item) return;

    const action: Action = { type: direction === 'right' ? 'keep' : 'trash', item };

    setActionStack(prev => {
      const next = [action, ...prev];
      return next.slice(0, UNDO_LIMIT);
    });

  if (direction === 'right') {
      onKeep?.(item);
    } else {
      const trashItem: TrashItem = { id: item.id, uri: item.uri, filename: (item as any).filename, deletedAt: new Date().toISOString() };
      const res = await addToTrash(trashItem);
      if (!res.success) {
        if (res.reason === 'limit_reached') {
          Alert.alert('Lixeira cheia', 'Sua lixeira atingiu o limite de itens. Remova antes de adicionar mais ou aumente o espaço (doação).');
        }
        // pop the last action we just pushed
        setActionStack(prev => prev.slice(1));
        return;
      } else {
        setTrashIds(prev => ({ ...prev, [item.id]: true }));
        setTrashedCount(prev => prev + 1);
      }
      onTrash?.(item);
    }

    // remove the item from local deck
    // use functional update and trigger prefetch if necessary
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

  // render area: use SwipeDeck component
  // loading / empty / final-card handling kept from original renderCards()
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
        <View style={[styles.finalCardWrap, { transform: [{ translateY: finalPanY }] }]}>
          <View style={styles.finalCard}>
            <Text style={styles.finalTitle}>Suas imagens da galeria acabaram</Text>
            <Text style={styles.finalBody}>
              Obrigado por usar nosso app — esperamos que tenha sido útil. Você pode reiniciar a galeria para revisar novamente.
            </Text>

            <View style={styles.finalActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleResetGallery}>
                <Text style={styles.primaryBtnText}>Rever galeria</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.ghostBtn} onPress={() => { onBack(); }}>
                <Text style={styles.ghostBtnText}>Fechar</Text>
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
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleResetGallery}>
            <Text style={styles.back}>Rever</Text>
          </TouchableOpacity>

          <View style={styles.counters}>
            <Text style={styles.counterText}>{effectivePremium ? `${trashedCount}` : `${trashedCount}/100`}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleUndo} disabled={actionStack.length === 0}>
          <Text style={[styles.undo, actionStack.length === 0 && { opacity: 0.4 }]}>Desfazer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deckWrap}>{renderDeckArea()}</View>

      {/* hint / debug removed as requested */}
    </SafeAreaView>
  );
}
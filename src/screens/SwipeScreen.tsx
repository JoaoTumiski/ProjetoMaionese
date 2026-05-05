// src/screens/SwipeScreen.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
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
import styles from './styles/SwipeScreenStyles';
import { useUndo } from '../hooks/useUndo';
import { useResetGallery } from '../hooks/useResetGallery';
import SwipeDeck, { SwipeDeckHandle, Item as DeckItem } from '../components/SwipeDeck';
import { addToTrash, getTrash, setPremiumFlag, TrashItem } from '../storage/trashStore';
import { PremiumContext } from '../context/PremiumContext';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;
const CARD_OFFSET = 12;
const VISIBLE_CARDS = 2;
const FALLBACK_URI = 'https://img.freepik.com/vetores-gratis/ilustracao-de-galeria-icone_53876-27002.jpg?semt=ais_se_enriched&w=740&q=80';
const PAGE_SIZE = 50;

const STORAGE_LAST_ID = '@swipe_last_id';
const STORAGE_SHUFFLED = '@swipe_shuffled';
const UNDO_LIMIT = 5;

type Props = {
  onBack: () => void;
  onKeep?: (item: any) => void;
  onTrash?: (item: any) => void;
  donationActive?: boolean;
  mediaType?: MediaLibrary.MediaTypeValue[];
};

type Item = { id: string; uri: string; filename?: string };
type Action = { type: 'keep' | 'trash'; item: Item };

export default function SwipeScreen({
  onBack,
  onKeep,
  onTrash,
  donationActive = false,
  mediaType = ['photo'],
}: Props) {
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? donationActive : isPremium;

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
  const loadedIdsRef = useRef<Set<string>>(new Set<string>());
  const swipeDeckRef = useRef<SwipeDeckHandle | null>(null);

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

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      setLoading(true);
      try {
        const list = await getTrash();
        const map: Record<string, boolean> = {};
        list.forEach(i => (map[i.id] = true));
        if (!mounted) return;
        setTrashIds(map);
        setTrashedCount(list.length);

        const p = await MediaLibrary.requestPermissionsAsync();
        if (p.status !== 'granted') {
          Alert.alert('Permissão necessária', 'Permita o acesso às fotos para carregar suas imagens.');
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
        let mapped = mappedAll.filter(a => !map[a.id]);

        const lastId = await AsyncStorage.getItem(STORAGE_LAST_ID);
        if (lastId) {
          const idx = mapped.findIndex(i => i.id === lastId);
          if (idx >= 0 && mapped.length > 0) {
            mapped = [...mapped.slice(idx), ...mapped.slice(0, idx)];
          }
        }

        setItems(mapped);
        setEndCursor(page.endCursor ?? null);
        setHasNextPage(Boolean((page as any).hasNextPage));

        try {
          const meta = await MediaLibrary.getAssetsAsync({ first: 1, mediaType });
          if ((meta as any).totalCount != null) setTotalAssets((meta as any).totalCount);
        } catch {}
      } catch (err) {
        console.warn('Erro carregando assets:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();
    return () => { mounted = false; };
  }, [effectivePremium]);

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
      const filtered = mappedAll.filter(a => !trashIds[a.id]);

      setItems(prev => {
        const existing = new Set(prev.map(p => p.id));
        const toAppend = filtered.filter(i => !existing.has(i.id));
        return [...prev, ...toAppend];
      });

      setEndCursor(page.endCursor ?? null);
      setHasNextPage(Boolean((page as any).hasNextPage));
    } catch (err) {
      console.warn('Erro loadNext:', err);
    } finally {
      setLoading(false);
    }
  }

  async function onSwipeCompleteHandler(direction: 'left' | 'right', item: DeckItem) {
    if (!item) return;

    const action: Action = { type: direction === 'right' ? 'keep' : 'trash', item: item as Item };
    setActionStack(prev => [action, ...prev].slice(0, UNDO_LIMIT));

    if (direction === 'right') {
      onKeep?.(item);
    } else {
      const trashItem: TrashItem = {
        id: item.id,
        uri: item.uri,
        filename: (item as any).filename,
        deletedAt: new Date().toISOString()
      };
      const res = await addToTrash(trashItem);
      if (!res.success) {
        if (res.reason === 'limit_reached') {
          Alert.alert('Lixeira cheia', 'Sua lixeira atingiu o limite de itens.');
        }
        setActionStack(prev => prev.slice(1));
        swipeDeckRef.current?.resetPosition();
        return;
      }
      setTrashIds(prev => ({ ...prev, [item.id]: true }));
      setTrashedCount(prev => prev + 1);
      onTrash?.(item);
    }

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
              <Ionicons name="sparkles" size={48} color={Theme.colors.primary} />
            </View>
            <Text style={styles.finalTitle}>Tudo Limpo!</Text>
            <Text style={styles.finalBody}>Você revisou todo o seu acervo com sucesso.</Text>
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
        <View style={styles.counters}>
          <Text style={styles.counterText}>
            {effectivePremium ? `${trashedCount} itens` : `${trashedCount}/100 itens`}
          </Text>
        </View>
        <TouchableOpacity onPress={handleUndo} disabled={actionStack.length === 0}>
          <Text style={[styles.undo, actionStack.length === 0 && { opacity: 0.4 }]}>Desfazer</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.deckWrap}>{renderDeckArea()}</View>
      <View style={styles.hint}>
        <Text style={styles.hintText}>Deslize para selecionar a opção</Text>
        <Text style={styles.hintTextSmall}>ESQUERDA: LIXEIRA  •  DIREITA: MANTER</Text>
      </View>
    </SafeAreaView>
  );
}
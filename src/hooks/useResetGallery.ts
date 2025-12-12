// src/hooks/useResetGallery.ts
import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dispatch, SetStateAction } from 'react';

const PAGE_SIZE = 50;
const STORAGE_LAST_ID = '@swipe_last_id';
const STORAGE_SHUFFLED = '@swipe_shuffled';
const FALLBACK_URI = 'https://via.placeholder.com/600x400?text=No+Image';

type Item = { id: string; uri: string; filename?: string };

type UseResetParams = {
  effectivePremium: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  // agora opcional: algumas telas (organize) não expõem setShuffled
  setShuffled?: Dispatch<SetStateAction<boolean>>;
  setItems: Dispatch<SetStateAction<Item[]>>;
  setEndCursor: Dispatch<SetStateAction<string | null>>;
  setHasNextPage: Dispatch<SetStateAction<boolean>>;
  trashIds: Record<string, boolean>;
};

function shuffleArray<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useResetGallery({
  effectivePremium,
  setLoading,
  setShuffled,
  setItems,
  setEndCursor,
  setHasNextPage,
  trashIds,
}: UseResetParams) {
  async function handleResetGallery() {
    try {
      setLoading(true);
      if (effectivePremium) {
        await AsyncStorage.removeItem(STORAGE_LAST_ID);
        await AsyncStorage.setItem(STORAGE_SHUFFLED, '0');
        if (typeof setShuffled === 'function') setShuffled(false);

        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });

        const mappedAll = (page.assets ?? []).map((a: any) => ({ id: a.id, uri: a.uri, filename: a.filename ?? undefined }));
        const mapped = mappedAll.filter((a: Item) => !trashIds[a.id]);

        setItems(mapped);
        setEndCursor(page.endCursor ?? null);
        setHasNextPage(Boolean((page as any).hasNextPage));
        Alert.alert('Galeria', 'Galeria reiniciada (início).');
      } else {
        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });

        const mappedAll = (page.assets ?? []).map((a: any) => ({ id: a.id, uri: a.uri, filename: a.filename ?? undefined }));
        const mapped = mappedAll.filter((a: Item) => !trashIds[a.id]);
        const shuffledPage = shuffleArray(mapped);
        setItems(shuffledPage);
        setEndCursor(page.endCursor ?? null);
        setHasNextPage(Boolean((page as any).hasNextPage));
        await AsyncStorage.setItem(STORAGE_SHUFFLED, '1');
        if (typeof setShuffled === 'function') setShuffled(true);
        Alert.alert('Galeria', 'Galeria embaralhada (primeira página).');
      }
    } catch (e) {
      console.warn('handleResetGallery error', e);
      Alert.alert('Erro', 'Não foi possível resetar a galeria.');
    } finally {
      setLoading(false);
    }
  }

  return { handleResetGallery };
}
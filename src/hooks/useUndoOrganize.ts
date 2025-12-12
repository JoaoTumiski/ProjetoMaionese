// src/hooks/useUndoOrganize.ts
import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import type { MutableRefObject } from 'react';

export type Item = { id: string; uri: string; filename?: string };

// action types used in organize flow
export type OrganizeAction =
  | { type: 'left' | 'right'; item: Item }            // simple swipe action (kept/ignored)
  | { type: 'moved'; item: Item; albumId: string }    // moved to album
  | { type: 'created'; item: Item; albumId?: string } // album created (optional)
  | { type: 'trash'; item: Item };                    // existing trash action (kept for parity)

type UseUndoOrganizeParams = {
  actionStack: OrganizeAction[];
  setActionStack: React.Dispatch<React.SetStateAction<OrganizeAction[]>>;
  // restore item to deck
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  // optional: update albums locally when undoing moves (optimistic)
  setAlbums?: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        title: string;
        count: number;
        thumbnailUri?: string | null;
      }[]
    >
  >;
  // optional: if your app uses a trash store, provide these to handle 'trash' undo
  setTrashIds?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setTrashedCount?: React.Dispatch<React.SetStateAction<number>>;
  positionRef: MutableRefObject<{ x: number; y: number }>;
  setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
};

export function useUndoOrganize({
  actionStack,
  setActionStack,
  setItems,
  setAlbums,
  setTrashIds,
  setTrashedCount,
  positionRef,
  setPos,
}: UseUndoOrganizeParams) {
  async function handleUndo() {
    if (!actionStack || actionStack.length === 0) {
      Alert.alert('Nada a desfazer');
      return;
    }

    // pop last action
    const [last, ...restStack] = actionStack;
    // update stack immediately (so UI reflects it)
    setActionStack(restStack);

    // normalize for easier handling
    const action = last as OrganizeAction;

    try {
      if (action.type === 'trash') {
        // previous behavior: remove from trash store (if provided)
        if (setTrashIds && setTrashedCount) {
          try {
            const { removeFromTrash } = await import('../storage/trashStore');
            await removeFromTrash(action.item.id);
            setTrashIds(prev => {
              const copy = { ...prev };
              delete copy[action.item.id];
              return copy;
            });
            setTrashedCount(prev => Math.max(0, prev - 1));
          } catch (e) {
            console.warn('undo removeFromTrash failed', e);
          }
        } else {
          // if no trash handlers provided, just restore locally
          setItems(prev => (prev.find(i => i.id === action.item.id) ? prev : [action.item, ...prev]));
        }

        // reset deck position
        positionRef.current = { x: 0, y: 0 };
        setPos({ x: 0, y: 0 });
        return;
      }

      if (action.type === 'moved') {
        const albumId = (action as any).albumId as string;
        const item = action.item;

        // Try to remove the asset from album via MediaLibrary if API exists
        const removeFn = (MediaLibrary as any).removeAssetsFromAlbumAsync;
        let removedFromAlbum = false;

        if (typeof removeFn === 'function') {
          try {
            // Some implementations expect (assetIds[], albumId) or (assetIds[], albumId, options)
            // Try the common signature: removeAssetsFromAlbumAsync([id], albumId)
            await (MediaLibrary as any).removeAssetsFromAlbumAsync([item.id], albumId);
            removedFromAlbum = true;
          } catch (e) {
            console.warn('removeAssetsFromAlbumAsync failed:', e);
            removedFromAlbum = false;
          }
        } else {
          // API not available: we cannot remove from album at system level
          removedFromAlbum = false;
        }

        // Optimistically update albums counts (decrement) so UI reflects undo quickly
        if (setAlbums) {
          setAlbums(prev =>
            prev.map(a => {
              if (a.id === albumId) {
                return { ...a, count: Math.max(0, (a.count ?? 0) - 1) };
              }
              return a;
            })
          );
        }

        // restore item into deck top
        setItems(prev => (prev.find(i => i.id === item.id) ? prev : [item, ...prev]));

        // reset deck position
        positionRef.current = { x: 0, y: 0 };
        setPos({ x: 0, y: 0 });

        // feedback if system-level removal didn't happen
        if (!removedFromAlbum) {
          Alert.alert(
            'Undo parcial',
            'A foto foi restaurada na revisão, mas não foi possível remover automaticamente do álbum no sistema. ' +
              'Isso pode acontecer em algumas versões do sistema/API. Você pode remover manualmente se desejar.'
          );
        }

        return;
      }

      // other simple swipe types: 'left' | 'right' or 'created'
      // just restore to deck (we don't attempt file system changes for these)
      const restoreItem = (action as any).item as Item;
      if (restoreItem) {
        setItems(prev => (prev.find(i => i.id === restoreItem.id) ? prev : [restoreItem, ...prev]));
      }

      // For 'created' we could attempt to delete album, but safer to just restore deck item and notify user
      if ((action as any).type === 'created') {
        Alert.alert('Undo', 'A criação do álbum foi registrada. Para remover o álbum criado, exclua manualmente (ou peça para eu implementar remoção automática).');
      }

      // reset deck position for all other cases
      positionRef.current = { x: 0, y: 0 };
      setPos({ x: 0, y: 0 });
    } catch (e) {
      console.warn('useUndoOrganize.handleUndo failed', e);
      Alert.alert('Erro', 'Não foi possível finalizar o desfazer. Veja logs.');
    }
  }

  return { handleUndo };
}
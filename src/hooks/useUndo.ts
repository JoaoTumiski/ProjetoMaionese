// src/hooks/useUndo.ts
import { Alert } from 'react-native';
import type { MutableRefObject } from 'react';

type Item = { id: string; uri: string; filename?: string };
type Action = { type: 'keep' | 'trash'; item: Item };

type UseUndoParams = {
  actionStack: Action[];
  setActionStack: React.Dispatch<React.SetStateAction<Action[]>>;
  setTrashIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setTrashedCount: React.Dispatch<React.SetStateAction<number>>;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  positionRef: MutableRefObject<{ x: number; y: number }>;
  setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
};

export function useUndo({
  actionStack,
  setActionStack,
  setTrashIds,
  setTrashedCount,
  setItems,
  positionRef,
  setPos,
}: UseUndoParams) {
  async function handleUndo() {
    if (actionStack.length === 0) {
      Alert.alert('Nada a desfazer');
      return;
    }

    const [last, ...restStack] = actionStack;
    const { type, item } = last;

    try {
      // nothing to stop (no animations)
    } catch (e) {}

    if (type === 'trash') {
      try {
        const { removeFromTrash } = await import('../storage/trashStore');
        await removeFromTrash(item.id);
        setTrashIds(prev => {
          const copy = { ...prev };
          delete copy[item.id];
          return copy;
        });
        setTrashedCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.warn('undo removeFromTrash failed', e);
      }
    }

    // re-introduce on top immediately (no intro animation)
    setItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [item, ...prev];
    });

    setActionStack(restStack);
    positionRef.current = { x: 0, y: 0 };
    setPos({ x: 0, y: 0 });
  }

  return { handleUndo };
}
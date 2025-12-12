// src/components/SwipeDeck.tsx
import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  View,
  Image,
  PanResponder,
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import styles, { CARD_WIDTH, CARD_HEIGHT } from '../styles/swipeStyles';

const { width } = Dimensions.get('window');
const DEFAULT_SWIPE_THRESHOLD = width * 0.28;

export type Item = { id: string; uri: string; filename?: string };

export type SwipeDeckHandle = {
  forceSwipe: (direction: 'left' | 'right') => void;
  resetPosition: () => void;
};

export type SwipeDeckProps = {
  items: Item[]; // lista (o pai deve alterar/remover o item quando receber onSwipe)
  visibleCards?: number; // quantas cartas renderizar (default 3)
  cardOffset?: number; // offset entre cartas (default 12)
  fallbackUri?: string;
  failedImages?: Record<string, boolean>;
  swipeThreshold?: number;
  onSwipe: (direction: 'left' | 'right', item: Item) => void;
  onImageLoad?: (id: string) => void;
  onImageError?: (id: string) => void;
};

const SwipeDeck = forwardRef<SwipeDeckHandle, SwipeDeckProps>((props, ref) => {
  const {
    items,
    visibleCards = 3,
    cardOffset = 12,
    fallbackUri = 'https://via.placeholder.com/600x400?text=No+Image',
    failedImages = {},
    swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
    onSwipe,
    onImageLoad,
    onImageError,
  } = props;

  // refs para sempre ter os valores atuais dentro das callbacks criadas uma vez
  const itemsRef = useRef<Item[]>(items);
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  // position (local to deck)
  const positionRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // expose some imperative handlers (usando itemsRef para pegar o topo atualizado)
  useImperativeHandle(ref, () => ({
    forceSwipe(direction: 'left' | 'right') {
      const top = itemsRef.current[0];
      if (!top) return;
      // reset local pos immediately
      positionRef.current = { x: 0, y: 0 };
      setPos({ x: 0, y: 0 });
      onSwipeRef.current?.(direction, top);
    },
    resetPosition() {
      positionRef.current = { x: 0, y: 0 };
      setPos({ x: 0, y: 0 });
    },
  }), []); // sem dependências porque usamos refs para os valores mutáveis

  // pan responder: criado uma vez, mas usa itemsRef/onSwipeRef in runtime
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        return dx > 14 || dy > 14;
      },
      onPanResponderMove: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        positionRef.current = { x: gesture.dx, y: gesture.dy };
        setPos({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        const dx = gesture.dx;
        const currentItems = itemsRef.current;
        if (dx > swipeThreshold) {
          // right
          const top = currentItems[0];
          if (top) onSwipeRef.current?.('right', top);
          positionRef.current = { x: 0, y: 0 };
          setPos({ x: 0, y: 0 });
        } else if (dx < -swipeThreshold) {
          // left
          const top = currentItems[0];
          if (top) onSwipeRef.current?.('left', top);
          positionRef.current = { x: 0, y: 0 };
          setPos({ x: 0, y: 0 });
        } else {
          // reset
          positionRef.current = { x: 0, y: 0 };
          setPos({ x: 0, y: 0 });
        }
      },
    })
  ).current;

  // Render stack (no animations)
  const sourceItems = items.length === 0 ? Array.from({ length: 5 }).map((_, i) => ({ id: `ph-${i}`, uri: fallbackUri })) : items;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 }}>
      {sourceItems
        .slice(0, visibleCards)
        .map((item, index) => {
          const isTop = index === 0;
          const offset = index * cardOffset;
          const uri = failedImages[item.id] ? fallbackUri : item.uri;

          const translateX = isTop ? pos.x : 0;
          const translateY = isTop ? pos.y : offset;
          const rotateDeg = isTop ? `${Math.max(-25, Math.min(25, (pos.x / width) * 25))}deg` : '0deg';

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  zIndex: 100 - index,
                  transform: [{ translateX }, { translateY }, { rotate: rotateDeg }],
                  opacity: 1,
                },
              ]}
              {...(isTop ? panResponder.panHandlers : {})}
            >
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
                onError={() => onImageError?.(item.id)}
                onLoad={() => onImageLoad?.(item.id)}
              />
            </View>
          );
        })
        .reverse()}
    </View>
  );
});

export default SwipeDeck;
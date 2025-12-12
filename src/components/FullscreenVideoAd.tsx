// src/components/FullscreenVideoAd.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
  Platform,
} from 'react-native';

type Props = {
  visible: boolean;
  test?: boolean; // sempre mock aqui
  hidden?: boolean;
  duration?: number; // total ad seconds
  skippableAfter?: number; // seconds until skip enabled
  onShown?: () => void;
  onFinished?: () => void;
  onClose?: (reason?: 'skipped' | 'finished' | 'user_closed' | 'error') => void;
  onError?: (error: Error) => void;
};

const { width, height } = Dimensions.get('window');

export default function FullscreenVideoAdMock({
  visible,
  test = true,
  hidden = false,
  duration = 15,
  skippableAfter = 5,
  onShown,
  onFinished,
  onClose,
  onError,
}: Props) {
  const [isVisible, setIsVisible] = useState<boolean>(visible && !hidden);
  const [secondsLeft, setSecondsLeft] = useState<number>(duration);
  const [skipEnabled, setSkipEnabled] = useState<boolean>(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsVisible(visible && !hidden);
  }, [visible, hidden]);

  useEffect(() => {
    if (!isVisible) {
      cleanupTimer();
      return;
    }

    try {
      onShown?.();
    } catch (e) {
      console.warn('onShown handler error', e);
    }

    // start progress animation
    Animated.timing(progress, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // countdown
    setSecondsLeft(duration);
    setSkipEnabled(false);

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearIntervalIfExists();
          handleFinish();
        }
        // enable skip when below threshold
        if (next <= duration - skippableAfter) {
          setSkipEnabled(true);
        }
        return next > 0 ? next : 0;
      });
    }, 1000);

    // prevent hardware back to close (common behavior for interstitials)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // on Android we can block back while ad visible (optional)
      if (isVisible) return true;
      return false;
    });

    return () => {
      clearIntervalIfExists();
      backHandler.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  function clearIntervalIfExists() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function cleanupTimer() {
    progress.stopAnimation();
    clearIntervalIfExists();
  }

  function handleFinish() {
    cleanupTimer();
    try {
      onFinished?.();
    } catch (e) {
      console.warn('onFinished handler error', e);
    }
    setIsVisible(false);
    try {
      onClose?.('finished');
    } catch (e) {
      console.warn('onClose handler error', e);
    }
  }

  function handleSkip() {
    if (!skipEnabled) return;
    cleanupTimer();
    try {
      onClose?.('skipped');
    } catch (e) {
      console.warn('onClose handler error', e);
    }
    setIsVisible(false);
  }

  function handleUserClose() {
    // allow user to close manually (optional)
    cleanupTimer();
    try {
      onClose?.('user_closed');
    } catch (e) {
      console.warn('onClose handler error', e);
    }
    setIsVisible(false);
  }

  // progress interpolation for width
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  if (!test) {
    // caso futuramente troque para SDK real, aqui você pode renderizar o player do SDK
    // mantendo a mesma API de props/handlers
  }

  return (
    <Modal visible={isVisible} animationType="fade" transparent={false}>
      <View style={styles.container} accessible accessibilityLabel="Ad full screen modal">
        {/* Fake video area */}
        <View style={styles.videoArea}>
          <Text style={styles.adBadge}>Ad • Patrocinado</Text>
          <View style={styles.fakeVideo}>
            <Text style={styles.playLabel}>[ Vídeo - Mock ]</Text>
            <Text style={styles.timerLabel}>{secondsLeft}s</Text>
          </View>

          {/* progress bar */}
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityLabel="Skip ad"
            style={[styles.skipButton, skipEnabled ? styles.skipEnabled : styles.skipDisabled]}
            activeOpacity={skipEnabled ? 0.8 : 1}
          >
            <Text style={styles.skipText}>{skipEnabled ? 'Skip' : `Skip in ${Math.max(0, Math.min(skippableAfter, secondsLeft))}s`}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleUserClose} accessibilityLabel="Close ad" style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Footer optional: advertiser name or CTA */}
        <View style={styles.footer}>
          <Text style={styles.advertiser}>Anúncio simulado — fornecido por MockNet</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // preto para vídeo
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoArea: {
    width: '100%',
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    alignItems: 'center',
  },
  adBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '700',
    overflow: 'hidden',
    zIndex: 10,
    fontSize: 12,
    textTransform: 'uppercase',
    // Note: Text inside TouchableOpacity expects color prop; we'll style text below
  } as any,
  fakeVideo: {
    width: '94%',
    height: height * 0.62,
    backgroundColor: '#222',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 28,
  },
  playLabel: {
    color: '#ddd',
    fontSize: 20,
    fontWeight: '700',
  },
  timerLabel: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#33c3ff',
  },
  controls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as any,
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipEnabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skipText: {
    color: '#fff',
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 12,
  },
  advertiser: {
    color: '#bbb',
    fontSize: 13,
  },
});
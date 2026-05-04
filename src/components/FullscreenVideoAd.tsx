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
import Theme from '../styles/theme';

type Props = {
  visible: boolean;
  test?: boolean;
  hidden?: boolean;
  duration?: number;
  skippableAfter?: number;
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
    } catch (e) {}

    Animated.timing(progress, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    setSecondsLeft(duration);
    setSkipEnabled(false);

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearIntervalIfExists();
          handleFinish();
        }
        if (next <= duration - skippableAfter) {
          setSkipEnabled(true);
        }
        return next > 0 ? next : 0;
      });
    }, 1000);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) return true;
      return false;
    });

    return () => {
      clearIntervalIfExists();
      backHandler.remove();
    };
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
    onFinished?.();
    setIsVisible(false);
    onClose?.('finished');
  }

  function handleSkip() {
    if (!skipEnabled) return;
    cleanupTimer();
    onClose?.('skipped');
    setIsVisible(false);
  }

  function handleUserClose() {
    cleanupTimer();
    onClose?.('user_closed');
    setIsVisible(false);
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <Modal visible={isVisible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <View style={styles.videoArea}>
          <Text style={styles.adBadge}>Anúncio</Text>
          <View style={styles.fakeVideo}>
            <Text style={styles.brandTitle}>Clear Galery</Text>
            <Text style={styles.brandSubtitle}>Curadoria de Elite</Text>
            <Text style={styles.timerLabel}>{secondsLeft}s</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handleSkip}
            style={[styles.skipButton, skipEnabled ? styles.skipEnabled : styles.skipDisabled]}
            activeOpacity={skipEnabled ? 0.8 : 1}
          >
            <Text style={styles.skipText}>
              {skipEnabled ? 'Pular' : `Aguarde ${Math.max(0, secondsLeft - (duration - skippableAfter))}s`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleUserClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.advertiser}>Obrigado por apoiar a curadoria digital</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoArea: {
    width: '100%',
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    alignItems: 'center',
  },
  adBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 34,
    left: 20,
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: '700',
    overflow: 'hidden',
    zIndex: 10,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as any,
  fakeVideo: {
    width: '90%',
    height: height * 0.6,
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 40,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  playLabel: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerLabel: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textMuted,
    fontSize: 16,
    marginTop: 24,
  },
  progressBarBackground: {
    height: 4,
    width: '100%',
    backgroundColor: Theme.colors.border,
    marginTop: 32,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  controls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as any,
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
  },
  skipEnabled: {
    borderColor: Theme.colors.primary,
  },
  skipDisabled: {
    borderColor: Theme.colors.border,
    opacity: 0.5,
  },
  skipText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    width: '100%',
    padding: 32,
    alignItems: 'center',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
  },
  advertiser: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
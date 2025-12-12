import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  onSkip: () => void;
  onDonate: () => void;
  onContinue: () => void;
};

export default function AdsInfoScreen({ onSkip, onDonate, onContinue }: Props) {
  const [count, setCount] = useState<number>(2);
  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // entrance fade
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // pulse animation for donate button (only while enabled)
    if (count === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [count, pulse]);

  function handleHeaderSkip() {
    if (count === 0) {
      onSkip();
    } else {
      Alert.alert('Aguarde', `Você poderá pular em ${count} segundo(s).`);
    }
  }

  function handleStartWithoutDonate() {
    if (count === 0) {
      onContinue();
    } else {
      Alert.alert('Aguarde', `Você poderá iniciar em ${count} segundo(s).`);
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHeaderSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.skipText, count > 0 && styles.skipDisabled]}>
            {count > 0 ? `Pular (${count})` : 'Pular'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📣</Text>
        </View>

        <Text style={styles.title}>Anúncios & Apoio</Text>

        <Text style={styles.subtitle}>
          O app é gratuito graças aos anúncios. Se preferir, faça uma doação única e nunca mais verá anúncios — além de receber outras bonificações.
        </Text>

        <View style={styles.actionsRow}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity
              style={styles.donateButton}
              onPress={onDonate}
              accessibilityLabel="Fazer doação"
            >
              <Text style={styles.donateText}>Fazer Doação</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.ghostButton, count > 0 && styles.ghostDisabled]}
            onPress={handleStartWithoutDonate}
            accessibilityLabel="Iniciar sem doar"
            activeOpacity={count === 0 ? 0.7 : 1}
          >
            <Text style={[styles.ghostText, count > 0 && styles.ghostTextDisabled]}>
              {count === 0 ? 'Iniciar sem doar (com anúncios)' : `Iniciar em ${count}s`}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.smallNote}>Doação libera anúncios e ativa benefícios permanentes.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>Você pode doar ou iniciar gratuitamente — sua escolha.</Text>
      </View>
    </Animated.View>
  );
}

const CARD_WIDTH = Math.min(760, width - 48);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 64,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  skipDisabled: { color: '#9ec6ff' },

  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: '#f1f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: {
    maxWidth: CARD_WIDTH,
    textAlign: 'center',
    color: '#444',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 20,
  },

  actionsRow: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    flexDirection: 'column',
    gap: 12,
  },

  donateButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#2f9e44',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#2f9e44',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  donateText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  ghostButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe9ff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  ghostDisabled: { borderColor: '#f0f6ff', backgroundColor: '#fbfdff' },
  ghostText: { color: '#0b63d6', fontWeight: '700', fontSize: 15 },
  ghostTextDisabled: { color: '#9ec6ff' },

  smallNote: {
    marginTop: 14,
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: CARD_WIDTH,
  },

  footer: {
    padding: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
  },
  footerHint: { textAlign: 'center', color: '#9aa4b2', fontSize: 13 },
});
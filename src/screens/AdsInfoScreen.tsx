// src/screens/AdsInfoScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');

type Props = {
  onSkip: () => void;
  onDonate: () => void;
  onContinue: () => void;
};

export default function AdsInfoScreen({ onSkip, onDonate, onContinue }: Props) {
  const [count, setCount] = useState<number>(3);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }).start();

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

  function handleSkip() {
    if (count === 0) onSkip();
    else Alert.alert('Aguarde', `Você poderá pular em ${count} segundos.`);
  }

  function handleContinue() {
    if (count === 0) onContinue();
    else Alert.alert('Aguarde', `O acesso será liberado em ${count} segundos.`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, count > 0 && { opacity: 0.5 }]}>
              {count > 0 ? `Pular (${count})` : 'Pular'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>CG</Text>
          </View>

          <Text style={styles.title}>Clear Galery</Text>
          <Text style={styles.subtitle}>Contribuição Simbólica</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Nossa curadoria é mantida através de anúncios. Você pode remover todas as interrupções e desbloquear tudo por apenas R$ 1,00.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onDonate}>
            <Text style={styles.primaryBtnText}>Apoiar com R$ 1,00</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, count > 0 && { opacity: 0.5 }]}
            onPress={handleContinue}
            activeOpacity={count === 0 ? 0.7 : 1}
          >
            <Text style={styles.secondaryBtnText}>
              {count === 0 ? 'Continuar com anúncios' : `Aguarde ${count}s`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerHint}>Sua curadoria, suas regras.</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1 },
  header: {
    height: 70,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  center: { flex: 1, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  icon: { fontSize: 32 },
  title: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 40,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 40,
  },
  cardText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 15,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primaryContainer,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryBtnText: {
    fontFamily: Theme.typography.fontFamily,
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  secondaryBtn: {
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  secondaryBtnText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerHint: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 11,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
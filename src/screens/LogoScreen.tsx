// src/screens/LogoScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');

type Props = {
  onFinish: () => void;
};

export default function LogoScreen({ onFinish }: Props): JSX.Element {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(onFinish, 1500);
    });
  }, [fadeAnim, onFinish, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>V</Text>
        </View>
        <Text style={styles.appName}>Clear Galery</Text>
        <Text style={styles.sub}>Simples e Direto</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoLetter: {
    fontFamily: Theme.typography.fontFamily,
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
  },
  appName: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sub: {
    fontFamily: Theme.typography.fontFamily,
    marginTop: 12,
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
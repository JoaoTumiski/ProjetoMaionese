import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  onFinish: () => void;
};

export default function LogoScreen({ onFinish }: Props): JSX.Element {
  const scale = useRef(new Animated.Value(0.6)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // animação de "pular" simples (bounce)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.08, duration: 420, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -6, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.98, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 4, duration: 160, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]),
    ]).start();

    // esperar 1.6s e chamar onFinish
    const t = setTimeout(() => onFinish(), 1600);
    return () => clearTimeout(t);
  }, [scale, translateY, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }, { translateY }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.appName}>MeuAppSwipe</Text>
      </Animated.View>

      <Text style={styles.sub}>Swipe imagens — swipar para manter/excluir (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center' },
  logoCircle: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: (width * 0.28) / 2,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  logoText: { color: '#fff', fontSize: 44, fontWeight: '800' },
  appName: { marginTop: 16, fontSize: 22, fontWeight: '700' },
  sub: { position: 'absolute', bottom: 32, fontSize: 13, color: '#666' },
});
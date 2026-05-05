// src/screens/LogoScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';
import styles from './styles/LogoScreenStyles';

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
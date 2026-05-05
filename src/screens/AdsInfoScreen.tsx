// src/screens/AdsInfoScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import styles from './styles/AdsInfoScreenStyles';

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
  }, [fade]);

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
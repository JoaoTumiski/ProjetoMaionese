import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');

type Props = {
  onSkip: () => void;
  onNext: () => void;
};

const SLIDES = [
  {
    title: 'Acervo Imaculado',
    desc: 'Sua biblioteca de fotos é o seu legado. Remova o excesso e preserve apenas a perfeição.',
    icon: 'CG',
  },
  {
    title: 'Curadoria Ágil',
    desc: 'Um deslize para a esquerda descarta. Para a direita, você eterniza. Simples, decisivo, meticuloso.',
    icon: 'CG',
  },
  {
    title: 'Organização de Elite',
    desc: 'Mova suas memórias para álbuns com a precisão de um arquivista profissional.',
    icon: 'CG',
  },
];

export default function OnboardingScreen({ onSkip, onNext }: Props) {
  const [index, setIndex] = useState(0);

  function handleNext() {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else onNext();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skip}>Pular</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{SLIDES[index].icon}</Text>
        </View>
        <Text style={styles.title}>{SLIDES[index].title}</Text>
        <Text style={styles.desc}>{SLIDES[index].desc}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pager}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>{index === SLIDES.length - 1 ? 'Começar' : 'Continuar'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
  },
  skip: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  icon: { fontSize: 44 },
  title: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  desc: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  pager: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceLight,
    marginHorizontal: 6,
  },
  dotActive: {
    width: 24,
    backgroundColor: Theme.colors.primary,
  },
  nextButton: {
    height: 60,
    backgroundColor: Theme.colors.primaryContainer,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nextText: {
    fontFamily: Theme.typography.fontFamily,
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
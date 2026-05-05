import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import styles from './styles/OnboardingScreenStyles';

type Props = {
  onSkip: () => void;
  onNext: () => void;
};

const SLIDES = [
  {
    title: 'Galeria Impecável',
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
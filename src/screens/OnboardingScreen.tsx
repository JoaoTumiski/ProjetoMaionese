import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  onSkip: () => void;
  onNext: () => void;
};

type Slide = {
  key: string;
  image: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    key: 's1',
    image: 'https://cdn-iconscout.com/illustration/free/thumb/onboarding-1310432-1111665.png',
    title: 'Swipe rápido',
    description: 'Deslize para a direita para manter e para a esquerda para enviar para a lixeira.',
  },
  {
    key: 's2',
    image: 'https://placehold.co/600x400?text=Selecione+Álbuns',
    title: 'Escolha álbuns',
    description: 'Selecione os álbuns que deseja revisar e organize suas fotos facilmente.',
  },
  {
    key: 's3',
    image: 'https://placehold.co/600x400?text=Lixeita+e+Restaurar',
    title: 'Lixeira e desfazer',
    description: 'Itens vão para a lixeira onde você pode restaurar ou excluir definitivamente.',
  },
];

export default function OnboardingScreen({ onSkip, onNext }: Props): JSX.Element {
  const [index, setIndex] = useState<number>(0);
  const slide = SLIDES[index];

  function handleNext() {
    if (index < SLIDES.length - 1) {
      setIndex(prev => prev + 1);
    } else {
      onNext();
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipWrap} onPress={onSkip} accessibilityLabel="Pular">
        <Text style={styles.skipText}>Pular</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Image
          source={{ uri: slide.image }}
          style={styles.image}
          resizeMode="contain"
          accessible
          accessibilityLabel={slide.title}
        />

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pager}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index ? styles.dotActive : undefined]}
              accessibilityLabel={`Página ${i + 1} de ${SLIDES.length}`}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} accessibilityLabel="Próximo">
          <Text style={styles.nextText}>
            {index < SLIDES.length - 1 ? 'Próximo' : 'Começar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipWrap: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  skipText: { color: '#007AFF', fontSize: 16 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  image: { width: width * 0.8, height: width * 0.6, marginBottom: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  description: { marginTop: 8, textAlign: 'center', color: '#666', fontSize: 14, paddingHorizontal: 10 },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    alignItems: 'center',
  },
  nextButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: '#007AFF', width: 12, height: 12, borderRadius: 12 },
});
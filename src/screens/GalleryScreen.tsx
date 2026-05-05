// src/screens/GalleryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import styles from './styles/GalleryScreenStyles';

type Props = {
  onBack: () => void;
  onOpenAlbum: (albumId: string) => void;
};

const MOCK_ALBUMS = [
  { id: 'a1', title: 'Câmera', count: 124, cover: 'https://placehold.co/200x200?text=Câmera' },
  { id: 'a2', title: 'Screenshots', count: 42, cover: 'https://placehold.co/200x200?text=Screens' },
  { id: 'a3', title: 'Receitas', count: 18, cover: 'https://placehold.co/200x200?text=Receitas' },
];

export default function GalleryScreen({ onBack, onOpenAlbum }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Selecionar Álbum</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={MOCK_ALBUMS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onOpenAlbum(item.id)}
            accessibilityLabel={`Abrir álbum ${item.title}`}
          >
            <View style={styles.coverBox}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.count} itens</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}
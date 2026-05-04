// src/screens/GalleryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    height: 70,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  back: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  list: { padding: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  coverBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: Theme.colors.surfaceLight,
  },
  cover: { width: '100%', height: '100%' },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  cardSub: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: Theme.colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
});
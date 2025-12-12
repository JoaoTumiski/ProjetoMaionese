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
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.count} itens</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  back: { color: '#007AFF', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    padding: 12,
    borderRadius: 10,
  },
  cover: { width: 76, height: 76, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#666', marginTop: 6 },
});
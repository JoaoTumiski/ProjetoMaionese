// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import BannerAd from '../components/BannerAd';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { PremiumContext } from '../context/PremiumContext';

const { width } = Dimensions.get('window');
const CARD_W = (width - 20 * 2 - 12) / 2;
const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=Sem+imagem';

type Props = {
  onOpenGallery: () => void;
  onOpenTrash: () => void;
  onOpenMenu: () => void;
  onOpenOrganize?: () => void; // novo callback para abrir Organize screen
  donationActive?: boolean; // fallback enquanto contexto carrega
};

export default function HomeScreen({
  onOpenGallery,
  onOpenTrash,
  onOpenMenu,
  onOpenOrganize,
  donationActive = false,
}: Props) {
  const { isPremium, setPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? donationActive : isPremium;

  const [lastUri, setLastUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function loadLatestPhoto() {
      setLoading(true);
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) {
            setLastUri(null);
            setLoading(false);
          }
          return;
        }

        const assets = await MediaLibrary.getAssetsAsync({
          first: 1,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });

        if (mounted) {
          const asset = assets.assets && assets.assets.length > 0 ? assets.assets[0] : null;
          setLastUri(asset?.uri ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Erro ao acessar media library:', err);
        if (mounted) {
          setLastUri(null);
          setLoading(false);
        }
      }
    }

    loadLatestPhoto();

    return () => {
      mounted = false;
    };
  }, []);

  function handleOpenGallery() {
    if (!lastUri) {
      MediaLibrary.getPermissionsAsync().then(p => {
        if (p.granted) {
          onOpenGallery();
        } else {
          Alert.alert(
            'Acesso à Fotos',
            'Para abrir a galeria precisamos de permissão para acessar suas fotos. Você pode permitir nas configurações.',
            [{ text: 'Ok' }]
          );
        }
      });
    } else {
      onOpenGallery();
    }
  }

  async function togglePremiumDebug() {
    try {
      await setPremium(!isPremium);
      Alert.alert('Debug', `Premium ${!isPremium ? 'ativado' : 'desativado'} (persistido).`);
    } catch (e) {
      console.warn('togglePremiumDebug failed', e);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu} accessibilityLabel="Menu">
          <Text style={styles.menu}>Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>MeuAppSwipe</Text>

        <TouchableOpacity onPress={() => Alert.alert('Apoiar', 'Abra a tela de doação via menu.')}>
          <Text style={styles.support}>{effectivePremium ? 'Premium' : 'Apoiar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.hi}>Bem-vindo</Text>
        <Text style={styles.subtitle}>
          Revise rapidamente suas fotos deslizando. Toque em Galeria para começar.
        </Text>

        <View style={styles.buttonsRow}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.card} onPress={handleOpenGallery} activeOpacity={0.9}>
              {loading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" />
                </View>
              ) : (
                <Image
                  source={{ uri: lastUri ?? PLACEHOLDER }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>

            <Text style={styles.cardLabel}>Galeria</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.card} onPress={onOpenTrash} activeOpacity={0.9}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Lixeira</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.cardLabel}>Lixeira</Text>
          </View>
        </View>

        {/* Nova seção: Organizar biblioteca */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Organizar biblioteca</Text>

          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                // se o callback não foi passado, mostrar um alerta
                if (onOpenOrganize) {
                  onOpenOrganize();
                } else {
                  Alert.alert('Navegação', 'onOpenOrganize não foi fornecido.');
                }
              }}
              activeOpacity={0.9}
            >
              {loading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" />
                </View>
              ) : (
                <Image
                  source={{ uri: lastUri ?? PLACEHOLDER }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>

            <Text style={styles.cardLabel}>Abrir Organizar</Text>
          </View>
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Dica rápida</Text>
          <Text style={styles.footerText}>
            Faça swipe para a direita para manter ou para a esquerda para enviar à lixeira. Você sempre pode desfazer imediatamente.
          </Text>
        </View>

        <View style={{ marginTop: 14, alignItems: 'center' }}>
          <TouchableOpacity onPress={togglePremiumDebug} style={{ padding: 8 }}>
            <Text style={{ color: '#0b63d6' }}>{premiumLoading ? 'Carregando...' : (isPremium ? 'Desativar Premium (debug)' : 'Ativar Premium (debug)')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* MOCKUP DE BANNER DE PROPAGANDA */}
      <BannerAd test={true}/>
      
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
  menu: { fontSize: 16, color: '#0b63d6', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700' },
  support: { color: '#0b63d6', fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  hi: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#666', marginBottom: 18 },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: CARD_W,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f7f9fc',
    padding: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef6ff',
  },
  placeholderText: { color: '#666', fontWeight: '700' },
  cardImage: { width: '100%', height: '100%' },
  cardLabel: { marginTop: 10, fontWeight: '700', fontSize: 15, color: '#222' },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: '#222' },
  footerBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff8e6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f1e6c9',
  },
  footerTitle: { fontWeight: '700', marginBottom: 6 },
  footerText: { color: '#5b4b00' },
});
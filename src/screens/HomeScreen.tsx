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
  ScrollView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { getTrash } from '../storage/trashStore';
import { PremiumContext } from '../context/PremiumContext';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../styles/theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - 20 * 2 - 12) / 2;
const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=Sem+imagem';

type Props = {
  onOpenGallery: () => void;
  onOpenTrash: () => void;
  onOpenMenu: () => void;
  onOpenOrganize?: () => void;
  onOpenVideoGallery?: () => void;
  onOpenVideoOrganize?: () => void;
  onOpenDonate?: () => void;
  donationActive?: boolean;
};

export default function HomeScreen({
  onOpenGallery,
  onOpenTrash,
  onOpenMenu,
  onOpenOrganize,
  onOpenVideoGallery,
  onOpenVideoOrganize,
  onOpenDonate,
  donationActive = false,
}: Props) {
  const { isPremium, setPremium, loading: premiumLoading } = useContext(PremiumContext);
  const effectivePremium = premiumLoading ? donationActive : isPremium;

  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [lastVideoUri, setLastVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') return;

        const photoAssets = await MediaLibrary.getAssetsAsync({
          first: 1,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });
        if (photoAssets.assets.length > 0) {
          setLastPhotoUri(photoAssets.assets[0].uri);
        }

        const videoAssets = await MediaLibrary.getAssetsAsync({
          first: 1,
          mediaType: ['video'],
          sortBy: ['creationTime'],
        });
        if (videoAssets.assets.length > 0) {
          setLastVideoUri(videoAssets.assets[0].uri);
        }

        const list = await getTrash();
        setTrashCount(list.length);
      } catch (e) {
        console.warn('Error loading assets/trash', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const togglePremiumDebug = () => {
    setPremium(!isPremium);
    Alert.alert('Modo Debug', `Premium ${!isPremium ? 'Ativado' : 'Desativado'}`);
  };

  const handleOpenGallery = () => {
    onOpenGallery();
  };

  const onOpenOrganizeHandler = () => {
    onOpenOrganize?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu} accessibilityLabel="Menu">
          <Text style={styles.menu}>Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Clear Galery</Text>

        {!effectivePremium ? (
          <TouchableOpacity onPress={onOpenDonate}>
            <Text style={styles.support}>Apoiar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.hi}>Bem-vindo</Text>
        <Text style={styles.subtitle}>
          Revise rapidamente suas fotos deslizando. Toque em Galeria para começar.
        </Text>

        <View style={styles.buttonsRow}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.card} onPress={handleOpenGallery} activeOpacity={0.8}>
              {loading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                </View>
              ) : (
                <Image
                  source={{ uri: lastPhotoUri ?? PLACEHOLDER }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
            <Text style={styles.cardLabel}>Fotos</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.card, !effectivePremium && { borderColor: Theme.colors.border, opacity: 0.8 }]}
              onPress={() => {
                if (!effectivePremium) {
                  Alert.alert('Funcionalidade Premium', 'A limpeza de vídeos é uma funcionalidade exclusiva para apoiadores.');
                  return;
                }
                onOpenVideoGallery?.();
              }}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                </View>
              ) : (
                <Image
                  source={{ uri: lastVideoUri ?? PLACEHOLDER }}
                  style={[styles.cardImage, !effectivePremium && { opacity: 0.5 }]}
                  resizeMode="cover"
                />
              )}
              {!effectivePremium && (
                <View style={styles.cardOverlay}>
                  <Text style={styles.overlayText}>🔒 Premium</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.cardLabel}>Vídeos</Text>
          </View>
        </View>

        {/* Nova seção: Organizar biblioteca */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Organizar biblioteca</Text>

          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.card}
                onPress={onOpenOrganizeHandler}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: lastPhotoUri ?? PLACEHOLDER }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.cardLabel}>Fotos</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.card, !effectivePremium && { opacity: 0.6 }]}
                onPress={() => {
                  if (!effectivePremium) {
                    Alert.alert('Funcionalidade Premium', 'A organização de vídeos é uma funcionalidade exclusiva para apoiadores.');
                    return;
                  }
                  onOpenVideoOrganize?.();
                }}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: lastVideoUri ?? PLACEHOLDER }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                )}
                {!effectivePremium && (
                   <View style={styles.cardOverlay}>
                      <Text style={[styles.overlayText, { fontSize: 12 }]}>🔒 Premium</Text>
                   </View>
                )}
              </TouchableOpacity>
              <Text style={styles.cardLabel}>Vídeos</Text>
            </View>
          </View>
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Dica rápida</Text>
          <Text style={styles.footerText}>
            Faça swipe para a direita para manter ou para a esquerda para enviar à lixeira. Você sempre pode desfazer imediatamente.
          </Text>
        </View>

        <View style={{ marginTop: 10, marginBottom: 40, alignItems: 'center' }}>
          <TouchableOpacity onPress={togglePremiumDebug} style={{ padding: 8 }}>
            <Text style={{ color: Theme.colors.primary }}>{premiumLoading ? 'Carregando...' : (isPremium ? 'Desativar Premium (debug)' : 'Ativar Premium (debug)')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botão Flutuante da Lixeira */}
      {trashCount > 0 && (
        <TouchableOpacity style={styles.fab} onPress={onOpenTrash} activeOpacity={0.9}>
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{trashCount}</Text>
          </View>
          <Ionicons name="trash-outline" size={32} color={Theme.colors.onPrimary} />
        </TouchableOpacity>
      )}

      {/* MOCKUP DE BANNER DE PROPAGANDA */}
      <BannerAd test={true} hidden={effectivePremium} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
  },
  menu: { fontSize: 16, color: Theme.colors.primary, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  support: { color: Theme.colors.primary, fontWeight: '700' },
  content: { padding: 20 },
  hi: { fontSize: 24, fontWeight: '700', marginBottom: 6, color: Theme.colors.text },
  subtitle: { color: Theme.colors.textSecondary, marginBottom: 24, fontSize: 15 },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: CARD_W,
    height: CARD_W * 1.2,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  cardLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  actionCard: {
    width: CARD_W,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  cardSub: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  footerBox: {
    marginTop: 32,
    padding: 24,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  footerTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  footerText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  ghostBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  ghostBtnText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: Theme.colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: Theme.colors.onPrimary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  fabBadgeText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
});
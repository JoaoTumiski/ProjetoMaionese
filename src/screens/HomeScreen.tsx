// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import BannerAd from '../components/BannerAd';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
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
import styles from './styles/HomeScreenStyles';

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
    <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
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
            Revise rapidamente suas fotos deslizando. Toque em Fotos para começar.
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
              Deslize para a direita para manter ou para a esquerda para enviar à lixeira. Você sempre pode desfazer imediatamente.
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
      </SafeAreaView>
      <BannerAd hidden={effectivePremium} />
    </View>
  );
}
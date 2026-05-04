// src/components/BannerAd.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Theme from '../styles/theme';

type BannerAdProps = {
  test?: boolean;          // quando true, mostra mock mesmo que o SDK esteja ativado
  collapsed?: boolean;     // futuro: altura reduzida
  hidden?: boolean;        // esconder quando premium
};

export default function BannerAd({ test = true, hidden = false }: BannerAdProps) {
  if (hidden) return null;

  // MOCK MODE (por enquanto sempre ativo)
  if (test) {
    return (
      <View style={styles.mockContainer}>
        <View style={styles.mockBox}>
          <Text style={styles.text}>[ Banner Ad - Mock ]</Text>
        </View>
      </View>
    );
  }

  // -----------------------------
  // FUTURO: AD MOB REAL AQUI
  // return (
  //   <AdMobBanner
  //      unitId={adUnitId}
  //      size="SMART_BANNER"
  //      onAdLoaded={() => console.log('banner loaded')}
  //      onAdFailedToLoad={(err) => console.log('banner error', err)}
  //   />
  // );
  // -----------------------------

  return null;
}

const styles = StyleSheet.create({
  mockContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  mockBox: {
    width: '100%',
    height: 70,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  text: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
});
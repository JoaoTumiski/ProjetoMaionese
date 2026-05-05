// src/components/BannerAd.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { adService } from '../services/adService';
import { BannerAd as AdMobBanner, BannerAdSize } from 'react-native-google-mobile-ads';

type BannerAdProps = {
  hidden?: boolean;        // esconder quando premium
};

export default function BannerAd({ hidden = false }: BannerAdProps) {
  if (hidden) return null;

  const adUnitId = adService.getBannerId();

  return (
    <View style={styles.container}>
      <AdMobBanner
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => console.log('Banner Ad Loaded')}
        onAdFailedToLoad={(error) => console.warn('Banner Ad Failed to Load:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
});
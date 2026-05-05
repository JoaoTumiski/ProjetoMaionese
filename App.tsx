// App.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { SafeAreaView, Alert, AppState, AppStateStatus, StatusBar } from 'react-native';
import Theme from './src/styles/theme';

import { PremiumProvider, PremiumContext } from './src/context/PremiumContext';
import { AdManagerProvider, useAdManager } from './src/context/AdManagerContext';

import LogoScreen from './src/screens/LogoScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AdsInfoScreen from './src/screens/AdsInfoScreen';
import DonateScreen from './src/screens/DonateScreen';
import HomeScreen from './src/screens/HomeScreen';
import SwipeScreen from './src/screens/SwipeScreen';
import TrashScreen from './src/screens/TrashScreen';
import OrganizeSwipeScreen from './src/screens/OrganizeSwipeScreen';
import MenuScreen from './src/screens/MenuScreen';
// tipos simples de tela
type Screen = 'logo' | 'onboarding' | 'adsinfo' | 'home' | 'donate' | 'gallery' | 'trash' | 'organize' | 'gallery_video' | 'organize_video' | 'menu';

// telas onde NÃO deve rodar o auto-ad (mas o contador continua)
const EXCLUDED_SCREENS = new Set<Screen>(['logo', 'onboarding', 'adsinfo', 'donate']);

/**
 * SessionAdController (global app session)
 *
 * Agora confia integralmente no `AdManagerContext` para saber quando mostrar um anúncio.
 * - Verifica periodicamente (polling).
 * - Se `canShowAdNow()` for true e a tela atual NÃO for excluída, solicita a exibição.
 */
function SessionAdController({ screen }: { screen: Screen }) {
  const adManager = useAdManager();
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => setAppState(nextState));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Se o usuário for premium ou o estado ainda está carregando, não fazemos nada.
    if (isPremium || premiumLoading) return;
    
    // Se o aplicativo estiver em background, pausamos as verificações.
    if (appState !== 'active') return;

    // Polling a cada 2 segundos para checar se é hora de exibir um anúncio
    const interval = setInterval(async () => {
      // Rechecagens de segurança antes de disparar
      if (AppState.currentState !== 'active' || isPremium || premiumLoading || EXCLUDED_SCREENS.has(screen)) return;

      const allowed = await adManager.canShowAdNow();
      if (allowed) {
        // requestShowAd marca a intenção e atualiza o timer no AsyncStorage
        const requested = await adManager.requestShowAd();
        if (requested) {
          await adManager.showInterstitial();
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [screen, isPremium, premiumLoading, appState, adManager]);

  return null;
}

/**
 * AppInner — sua árvore de telas.
 * Substitui seu AppInner anterior integrando SessionAdController.
 */
function AppInner(): JSX.Element {
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);
  const [screen, setScreen] = useState<Screen>('logo');
  const [logoFinished, setLogoFinished] = useState(false);

  // Efeito para decidir a próxima tela apenas quando Logo E Premium estiverem prontos
  useEffect(() => {
    if (logoFinished && !premiumLoading) {
      if (isPremium) {
        setScreen('home');
      } else {
        setScreen('onboarding');
      }
    }
  }, [logoFinished, premiumLoading, isPremium]);

  return (
    <AdManagerProvider>
      {/* controller global de sessão — passa a tela atual para regras de exibição */}
      <SessionAdController screen={screen} />

      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.background }}>

        {screen === 'logo' && (
          <LogoScreen 
            onFinish={() => setLogoFinished(true)} 
          />
        )}

        {screen === 'onboarding' && (
          <OnboardingScreen
            onSkip={() => setScreen('home')}
            onNext={() => setScreen('adsinfo')}
          />
        )}

        {screen === 'adsinfo' && (
          <AdsInfoScreen
            onSkip={() => setScreen('home')}
            onDonate={() => setScreen('donate')}
            onContinue={() => setScreen('home')}
          />
        )}

        {screen === 'home' && (
          <HomeScreen
            onOpenGallery={() => setScreen('gallery')}
            onOpenTrash={() => setScreen('trash')}
            onOpenMenu={() => setScreen('menu')}
            onOpenOrganize={() => setScreen('organize')}
            onOpenVideoGallery={() => setScreen('gallery_video')}
            onOpenVideoOrganize={() => setScreen('organize_video')}
            onOpenDonate={() => setScreen('donate')}
          />
        )}

        {screen === 'gallery' && (
          <SwipeScreen
            onBack={() => setScreen('home')}
            onKeep={(item) => {
              console.log('kept', item?.id);
            }}
            onTrash={(item) => {
              console.log('trashed', item?.id);
            }}
          />
        )}

        {screen === 'organize' && (
          <OrganizeSwipeScreen
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'gallery_video' && (
          <SwipeScreen
            onBack={() => setScreen('home')}
            mediaType={['video']}
          />
        )}

        {screen === 'organize_video' && (
          <OrganizeSwipeScreen
            onBack={() => setScreen('home')}
            mediaType={['video']}
          />
        )}

        {screen === 'trash' && (
          <TrashScreen
            onBack={() => setScreen('home')}
            onRestore={(id) => {
              console.log('restore', id);
            }}
            onDeletePermanent={(id) => {
              console.log('deletePermanent', id);
            }}
          />
        )}

        {screen === 'menu' && (
          <MenuScreen
            onBack={() => setScreen('home')}
            onOpenDonate={() => setScreen('donate')}
            onOpenTrash={() => setScreen('trash')}
          />
        )}

        {screen === 'donate' && (
          <DonateScreen
            onBack={() => setScreen('home')}
          />
        )}
      </SafeAreaView>
    </AdManagerProvider>
  );
}

export default function App(): JSX.Element {
  return (
    <PremiumProvider>
      <AppInner />
    </PremiumProvider>
  );
}
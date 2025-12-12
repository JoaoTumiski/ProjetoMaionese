// App.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { SafeAreaView, Alert, AppState, AppStateStatus } from 'react-native';
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
import FullscreenVideoAdMock from './src/components/FullscreenVideoAd'; // seu mock

// tipos simples de tela
type Screen = 'logo' | 'onboarding' | 'adsinfo' | 'home' | 'donate' | 'gallery' | 'trash' | 'organize';

// telas onde NÃO deve rodar o auto-ad (mas o contador continua)
const EXCLUDED_SCREENS = new Set<Screen>(['logo', 'onboarding', 'adsinfo', 'donate']);

// intervalo randômico em segundos (2-3 min)
const MIN_SESSION_SECONDS = 120;
const MAX_SESSION_SECONDS = 180;

function randomSeconds(min = MIN_SESSION_SECONDS, max = MAX_SESSION_SECONDS) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * SessionAdController (global app session)
 *
 * - Mantém um contador global (remainingSeconds) que conta mesmo ao trocar telas.
 * - Pausa quando o app vai para background e resume quando volta.
 * - Quando remainingSeconds chega a 0:
 *    - se current screen FOR permitida => tenta mostrar ad imediatamente (adManager.requestShowAd()).
 *    - se current screen FOR excluída => marca expired = true e aguarda até entrar em tela permitida para mostrar.
 * - Depois de mostrar um ad (manual ou automático marcado por requestShowAd), reseta remainingSeconds para novo rand(2-3min).
 *
 * Observações:
 * - Manual flow (ex.: Trash) usa forceAllowOnce + requestShowAd e continua funcionando; forceAllowOnce garante que o manual sempre possa exibir.
 * - Se o app for destruído pelo sistema, o contador reinicia ao relançar o app (não há persistência cross-launch).
 */
function SessionAdController({ screen }: { screen: Screen }) {
  const adManager = useAdManager();
  const { isPremium, loading: premiumLoading } = useContext(PremiumContext);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => randomSeconds());
  const remainingRef = useRef<number>(remainingSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true); // runs when app in foreground and not premium
  const tickingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [showAd, setShowAd] = useState(false);
  const expiredRef = useRef<boolean>(false); // true if timer reached 0 while on excluded screen
  const pendingAutoRef = useRef<boolean>(false); // auto-triggered showing in progress

  // keep ref in sync for handlers
  useEffect(() => {
    remainingRef.current = remainingSeconds;
  }, [remainingSeconds]);

  // When premium state changes: if premium, stop; if unprivileged, resume.
  useEffect(() => {
    if (isPremium || premiumLoading) {
      stopTicker();
    } else {
      // resume ticker if not manual shown
      startTicker();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, premiumLoading]);

  // AppState handling: pause on background, resume on active
  useEffect(() => {
    function handleAppState(next: AppStateStatus) {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        // resumed -> restart ticker where left off
        if (!isPremium && !premiumLoading) {
          startTicker();
        }
        // if expired and now on allowed screen, try show
        maybeShowExpiredAd();
      } else if (next.match(/inactive|background/)) {
        // going to background -> pause
        stopTicker();
      }
    }

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, premiumLoading, screen]);

  // Start ticking every 1s (decrements remainingRef and remainingSeconds)
  function startTicker() {
    if (tickingIntervalRef.current) return;
    setIsRunning(true);
    tickingIntervalRef.current = setInterval(() => {
      // If premium or loading, skip ticking
      if (isPremium || premiumLoading) {
        return;
      }

      // decrement ref and state
      remainingRef.current = Math.max(0, (remainingRef.current ?? 0) - 1);
      setRemainingSeconds(remainingRef.current);

      if (remainingRef.current <= 0) {
        // timer expired
        clearTickerInterval();
        onTimerExpired();
      }
    }, 1000);
  }

  function clearTickerInterval() {
    if (tickingIntervalRef.current) {
      clearInterval(tickingIntervalRef.current);
      tickingIntervalRef.current = null;
    }
    setIsRunning(false);
  }

  function stopTicker() {
    clearTickerInterval();
  }

  async function onTimerExpired() {
    // If current screen is allowed, try to show ad now
    if (!EXCLUDED_SCREENS.has(screen) && !isPremium && !premiumLoading) {
      try {
        const allowed = await adManager.requestShowAd();
        if (allowed) {
          pendingAutoRef.current = true;
          setShowAd(true);
          expiredRef.current = false;
        } else {
          // couldn't show (maybe loading) -> schedule small retry
          expiredRef.current = true;
          scheduleShortRetry();
        }
      } catch (e) {
        console.warn('[SessionAd] error onTimerExpired requestShowAd', e);
        expiredRef.current = true;
        scheduleShortRetry();
      }
    } else {
      // mark expired and wait until we are in allowed screen
      expiredRef.current = true;
      // no ticker running; but we keep expired flag so when user navigates to allowed screen we show the ad.
    }
  }

  // small retry (10s) used when requestShowAd fails temporarily
  function scheduleShortRetry() {
    setTimeout(() => {
      // only try again if not premium and not already showing ad
      if (isPremium || premiumLoading) return;
      if (!expiredRef.current) return;
      maybeShowExpiredAd();
    }, 10 * 1000);
  }

  // Called whenever screen changes or app resumes: if expired and we're on allowed screen, attempt to show.
  async function maybeShowExpiredAd() {
    if (!expiredRef.current) return;
    if (isPremium || premiumLoading) {
      expiredRef.current = false;
      resetTimer();
      return;
    }
    if (EXCLUDED_SCREENS.has(screen)) {
      return; // still excluded
    }

    // try to request & show
    try {
      const allowed = await adManager.requestShowAd();
      if (allowed) {
        pendingAutoRef.current = true;
        setShowAd(true);
        expiredRef.current = false;
      } else {
        // still not allowed -> schedule retry
        scheduleShortRetry();
      }
    } catch (e) {
      console.warn('[SessionAd] maybeShowExpiredAd error', e);
      scheduleShortRetry();
    }
  }

  // after ad finishes or is closed, reset a new random timer and resume ticking
  function handleAdClosedFromAuto() {
    pendingAutoRef.current = false;
    setShowAd(false);
    resetTimer();
    // resume ticker if app active and not premium
    if (AppState.currentState === 'active' && !isPremium && !premiumLoading) {
      startTicker();
    }
  }

  function handleAdFinishedFromAuto() {
    pendingAutoRef.current = false;
    setShowAd(false);
    resetTimer();
    if (AppState.currentState === 'active' && !isPremium && !premiumLoading) {
      startTicker();
    }
  }

  function resetTimer() {
    const next = randomSeconds();
    remainingRef.current = next;
    setRemainingSeconds(next);
    expiredRef.current = false;
  }

  // Start ticker on mount if app active and not premium
  useEffect(() => {
    if (!isPremium && !premiumLoading && AppState.currentState === 'active') {
      startTicker();
    }

    return () => {
      clearTickerInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // run maybeShowExpiredAd when screen changes (in case expired happened earlier)
  useEffect(() => {
    maybeShowExpiredAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return (
    <FullscreenVideoAdMock
      visible={showAd && !isPremium}
      duration={15}
      skippableAfter={5}
      onShown={() => console.log('session auto ad shown')}
      onFinished={handleAdFinishedFromAuto}
      onClose={() => handleAdClosedFromAuto()}
    />
  );
}

/**
 * AppInner — sua árvore de telas.
 * Substitui seu AppInner anterior integrando SessionAdController.
 */
function AppInner(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('logo');

  return (
    <AdManagerProvider>
      {/* controller global de sessão — passa a tela atual para regras de exibição */}
      <SessionAdController screen={screen} />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {screen === 'logo' && <LogoScreen onFinish={() => setScreen('onboarding')} />}

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
            onOpenMenu={() => setScreen('adsinfo')}
            onOpenOrganize={() => setScreen('organize')}
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

        {screen === 'donate' && (
          <DonateScreen
            onBack={() => setScreen('adsinfo')}
            onDonate={(amount) => {
              Alert.alert('Doação recebida (simulada)', `Valor: R$ ${amount.toFixed(2)}`);
              setScreen('home');
            }}
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
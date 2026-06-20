import { useRegisterSW } from 'virtual:pwa-register/react';

// Dunne wrapper om vite-plugin-pwa's officiële React-hook — vervangt de
// handgeschreven _swRegistration/_pendingWorker/postMessage-logica en
// toonUpdateBanner()/dismissUpdateBanner()/reloadApp() uit docs/index.html.
export function usePWA() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW();

  const bijwerken = () => updateServiceWorker(true);
  const sluitMelding = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  return { needRefresh, offlineReady, bijwerken, sluitMelding };
}

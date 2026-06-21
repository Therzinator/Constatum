import { useEffect } from 'react';
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

  // "Klaar voor offline gebruik" is puur informatief (geen actie nodig,
  // anders dan needRefresh dat op een bevestigde herlaad-klik wacht) —
  // verdwijnt daarom vanzelf. needRefresh blijft staan tot de gebruiker
  // zelf Herladen/Sluiten klikt.
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  return { needRefresh, offlineReady, bijwerken, sluitMelding };
}

import { usePWA } from '../../hooks/usePWA.js';
import './UpdateBanner.css';

// Komt overeen met #update-banner uit docs/index.html
// (toonUpdateBanner/dismissUpdateBanner/reloadApp), nu aangestuurd door
// vite-plugin-pwa's useRegisterSW i.p.v. handgeschreven SW-postMessages.
export function UpdateBanner() {
  const { needRefresh, offlineReady, bijwerken, sluitMelding } = usePWA();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="update-banner">
      <span className="update-banner-text">
        {needRefresh
          ? 'SpuitLogger is klaar om te installeren.'
          : 'SpuitLogger is klaar voor offline gebruik.'}
      </span>
      {needRefresh && (
        <button type="button" className="btn-primary update-banner-reload" onClick={bijwerken}>
          Herladen
        </button>
      )}
      <button type="button" className="update-banner-close" onClick={sluitMelding} aria-label="Sluiten">✕</button>
    </div>
  );
}

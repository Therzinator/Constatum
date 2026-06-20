import { useEffect } from 'react';
import './NotificatieBanner.css';

// In-app banner voor een nieuwe melding binnen het ingestelde bereik
// (zie hooks/useBuurtNotificaties.js). Verschijnt naast — niet in plaats
// van — de native browser-notificatie, zodat het ook werkt als de gebruiker
// geen permissie heeft gegeven.
export function NotificatieBanner({ banner, onSluiten, duurMs = 6000 }) {
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(onSluiten, duurMs);
    return () => clearTimeout(timer);
  }, [banner, onSluiten, duurMs]);

  if (!banner) return null;

  return (
    <div className="notificatie-banner">
      <span className="notificatie-banner-icoon">📍</span>
      <div className="notificatie-banner-body">
        <div className="notificatie-banner-titel">{banner.titel}</div>
        <div className="notificatie-banner-tekst">{banner.tekst}</div>
      </div>
      <button type="button" className="notificatie-banner-close" title="Sluiten" onClick={onSluiten}>✕</button>
    </div>
  );
}

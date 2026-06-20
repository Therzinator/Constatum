import { useState, useCallback } from 'react';
import {
  laadNotificatieInstellingen,
  slaNotificatieInstellingenOp,
  afstandBinnenBereik,
  formatNotificatieTekst
} from '../lib/notificaties/buurtMelding.js';

// Notificaties bij nieuwe meldingen in de buurt van de thuislocatie.
// Wordt gevoed door het 'INSERT'-event van de realtime-listener in
// useSupabaseSync.js (zie verwerkNieuweEntry hieronder).
export function useBuurtNotificaties(thuislocatie, user) {
  const [instellingen, setInstellingen] = useState(() => laadNotificatieInstellingen());
  const [permissie, setPermissie] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [banner, setBanner] = useState(null); // { id, titel, tekst } | null

  const zetAan = useCallback((aan) => {
    setInstellingen((prev) => {
      const next = { ...prev, aan };
      slaNotificatieInstellingenOp(next);
      return next;
    });
  }, []);

  const zetRadius = useCallback((radiusMeter) => {
    setInstellingen((prev) => {
      const next = { ...prev, radiusMeter };
      slaNotificatieInstellingenOp(next);
      return next;
    });
  }, []);

  const vraagPermissie = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    setPermissie(result);
    return result;
  }, []);

  const sluitBanner = useCallback(() => setBanner(null), []);

  // Aanroepen door useSupabaseSync bij een 'INSERT'-event op de entries-tabel.
  const verwerkNieuweEntry = useCallback((entry) => {
    if (!instellingen.aan || !entry) return;
    if (user && entry.user_id === user.id) return; // eigen melding — geen notificatie
    if (!entry.opt_in_buurt) return; // melder heeft geen toestemming gegeven om te delen

    const afstand = afstandBinnenBereik(entry, thuislocatie, instellingen.radiusMeter);
    if (afstand == null) return;

    const { titel, tekst } = formatNotificatieTekst(entry, afstand);
    setBanner({ id: entry.id || Date.now(), titel, tekst });

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(titel, { body: tekst });
      } catch { /* browser blokkeert notificatie — banner blijft zichtbaar */ }
    }
  }, [instellingen, thuislocatie, user]);

  return {
    instellingen,
    permissie,
    banner,
    zetAan,
    zetRadius,
    vraagPermissie,
    sluitBanner,
    verwerkNieuweEntry
  };
}

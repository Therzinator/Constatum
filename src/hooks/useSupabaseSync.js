import { useState, useCallback, useRef, useEffect } from 'react';
import { sbClient, SUPABASE_ENABLED } from '../lib/supabase/client.js';
import { sbSyncMeldingenBatch, laadVanSupabase as laadVanSupabaseData } from '../lib/supabase/entries.js';
import { sbSyncBijlagen } from '../lib/supabase/bijlagen.js';
import { sbAuditLog } from '../lib/supabase/auditLog.js';
import { getMeldingen, saveMeldingen } from '../lib/storage/localStorage.js';

// Komt overeen met syncNu/laadVanSupabase/startRealtime/stopRealtime uit
// docs/index.html. UI-feedback (toonSyncBalk/toast/updateSyncHeaderDot) is
// hier niet overgenomen — de component leest syncBezig/syncStatus en het
// resultaat van syncNu()/laadVanCloud() om dat zelf te tonen.
//
// meldingenApi: het object dat hooks/useMeldingen.js teruggeeft
// (offlineQueue, deleteQueue, voegToeAanQueue, voegToeAanDeleteQueue,
// verwijderUitQueue, herlaadMeldingen).
export function useSupabaseSync(user, meldingenApi) {
  const [syncBezig, setSyncBezig] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | bezig | ok | fout | offline
  const realtimeChannelRef = useRef(null); // { channelEigen, channelBuurt } of null
  const reloadTimerRef = useRef(null);
  const retryTimerRef = useRef(null);  // Backoff-timer bij verbindingsfouten
  const retryCountRef = useRef(0);     // Aantal opeenvolgende mislukte verbindingen

  const {
    offlineQueue,
    deleteQueue,
    voegToeAanQueue,
    verwijderUitQueue,
    herlaadMeldingen
  } = meldingenApi;

  // Hoofd sync functie: verwerk offline queue
  const syncNu = useCallback(async () => {
    if (!SUPABASE_ENABLED || !user || syncBezig) return null;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return null;
    }

    setSyncBezig(true);
    setSyncStatus('bezig');

    const sb = sbClient();

    // ── Verwerk delete queue eerst ────────────────────────────
    const teVerwijderenAantal = deleteQueue.length;
    if (sb && deleteQueue.length > 0) {
      const teVerwijderen = [...deleteQueue];
      for (const delId of teVerwijderen) {
        const { error } = await sb.from('entries')
          .update({ deleted: true }, { count: 'exact' })
          .eq('id', delId)
          .eq('user_id', user.id);

        if (!error) {
          // Verwijder ook de koppeling met groepen (stille mislukking als er geen RLS-rechten zijn)
          await sb.from('entries_groepen').delete().eq('entry_id', delId);
          await sbAuditLog(delId, 'deleted', { door: user.id }, user);
          verwijderUitQueue(delId);
        } else {
          console.warn('[Supabase] Delete queue mislukt voor:', delId, error.message);
        }
      }
    }

    const meldingen = getMeldingen();
    const teSync = meldingen.filter(m =>
      m.sync_status === 'lokaal' ||
      m.sync_status === 'sync_mislukt' ||
      offlineQueue.includes(m.id)
    );

    let geslaagd = 0;
    let mislukt  = 0;

    // Batch upsert alle entries in één DB-call i.p.v. N seriële calls
    let oks = teSync.map(() => false);
    try {
      oks = await sbSyncMeldingenBatch(teSync, user);
    } catch (e) {
      console.error('[Supabase] Batch sync fout:', e.message);
    }

    // Bijlagen parallel uploaden — bijlagen per melding hebben eigen meldingId,
    // dus geen conflict. De localStorage-update daarna is serieel (één write).
    const bijlagenResultaten = await Promise.all(teSync.map(async (melding, i) => {
      if (!oks[i]) return false;
      await sbSyncBijlagen(melding.id, melding.bestanden, user);
      sbAuditLog(melding.id, 'synced', {
        hash:     melding.hash,
        rfc3161:  melding.rfc3161?.timestamp || null,
        bijlagen: melding.bestanden?.length  || 0,
        device:   navigator.platform
      }, user);
      return true;
    }));

    // Eén lees + één schrijf naar localStorage, na afloop van alle parallelle taken
    const alle = getMeldingen();
    for (let i = 0; i < teSync.length; i++) {
      const melding = teSync[i];
      const idx = alle.findIndex(m => m.id === melding.id);
      if (bijlagenResultaten[i]) {
        if (idx >= 0) { alle[idx].sync_status = 'synced'; alle[idx].sync_at = new Date().toISOString(); }
        verwijderUitQueue(melding.id);
        geslaagd++;
      } else {
        if (idx >= 0) { alle[idx].sync_status = 'sync_mislukt'; }
        voegToeAanQueue(melding.id);
        mislukt++;
      }
    }
    saveMeldingen(alle);

    setSyncBezig(false);
    setSyncStatus(mislukt > 0 ? 'fout' : 'ok');
    herlaadMeldingen();

    return { geslaagd, mislukt, verwijderingen: teVerwijderenAantal };
  }, [user, syncBezig, offlineQueue, deleteQueue, voegToeAanQueue, verwijderUitQueue, herlaadMeldingen]);

  // Laad meldingen van Supabase (andere apparaten)
  // deleteQueue meegeven is nodig om te voorkomen dat een lokaal net
  // verwijderde melding waarvan de server-side soft-delete nog niet is
  // bevestigd, door deze reload wordt teruggezet (zie toelichting bij
  // laadVanSupabase() in lib/supabase/entries.js).
  const laadVanCloud = useCallback(async (force = false) => {
    if (!user) throw new Error('Niet ingelogd');
    if (!navigator.onLine) throw new Error('Offline');
    const resultaat = await laadVanSupabaseData(user, force, deleteQueue);
    herlaadMeldingen();
    return resultaat;
  }, [user, herlaadMeldingen, deleteQueue]);

  // Stabiele ref zodat startRealtime laadVanCloud kan aanroepen zonder
  // laadVanCloud in zijn eigen useCallback-deps op te nemen. Dat was de
  // root-oorzaak van de reconnect-lus (2026-06-21): laadVanCloud verandert
  // elke render als herlaadMeldingen instabiel is → startRealtime
  // verandert → useEffect trigt → stopRealtime + startRealtime → loop.
  const laadVanCloudRef = useRef(laadVanCloud);
  laadVanCloudRef.current = laadVanCloud;

  const stopRealtime = useCallback(() => {
    clearTimeout(reloadTimerRef.current);
    clearTimeout(retryTimerRef.current);
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.channelEigen?.unsubscribe();
      realtimeChannelRef.current.channelBuurt?.unsubscribe();
      realtimeChannelRef.current = null;
    }
  }, []);

  const startRealtime = useCallback(() => {
    const sb = sbClient();
    if (!sb || !user || !SUPABASE_ENABLED) return;
    if (realtimeChannelRef.current) return; // al actief
    if (retryCountRef.current >= 3) {
      console.warn('[Realtime] Max herverbindingspogingen bereikt — realtime uitgeschakeld');
      return;
    }

    // Gedebounced reload — voorkomt N+1-queries bij admin-backfill-bursts
    const onWijziging = () => {
      clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = setTimeout(() => laadVanCloudRef.current?.(), 800);
    };

    // Eén fout-handler per channel-paar — de `errorGemeld` flag voorkomt
    // dat beide channels tegelijk een retry starten bij gelijktijdige fouten.
    let errorGemeld = false;
    const handleStatus = (status) => {
      console.log('[Realtime] Status:', status);
      if (status === 'SUBSCRIBED') {
        retryCountRef.current = 0;
        errorGemeld = false;
      } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !errorGemeld) {
        errorGemeld = true;
        retryCountRef.current++;
        const delay = 2000 * 2 ** (retryCountRef.current - 1); // 2s → 4s → 8s
        console.warn(`[Realtime] Fout — retry ${retryCountRef.current}/3 na ${delay}ms`);
        // Teardown verlopen channels zonder stopRealtime() aan te roepen
        // (dat wist ook retryTimerRef, maar de timer staat er nog niet op)
        realtimeChannelRef.current?.channelEigen?.unsubscribe();
        realtimeChannelRef.current?.channelBuurt?.unsubscribe();
        realtimeChannelRef.current = null;
        retryTimerRef.current = setTimeout(() => startRealtime(), delay);
      }
    };

    // Twee gefilterde channels:
    // 1. Eigen meldingen (alle events op eigen user_id)
    // 2. Buurt-meldingen (alleen INSERTs waarbij opt_in_buurt=true)
    // De filter-waarden worden server-side toegepast door Supabase Realtime
    // (postgres_changes CDC) — vereist dat de tabel REPLICA IDENTITY FULL
    // heeft of dat de gefilterde kolom in de primary key zit.
    realtimeChannelRef.current = {
      channelEigen: sb
        .channel(`entries-eigen-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `user_id=eq.${user.id}`
        }, onWijziging)
        .subscribe(handleStatus),
      channelBuurt: sb
        .channel('entries-buurt')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'entries',
          filter: 'opt_in_buurt=eq.true'
        }, onWijziging)
        .subscribe(handleStatus)
    };
  }, [user]); // Stabiel — laadVanCloud via ref, geen andere vluchtige deps

  // Realtime start/stop volgt automatisch de inlogstatus.
  // startRealtime is stabiel (enkel dep: user) dus dit effect trigt
  // alleen bij login/logout — niet bij elke render.
  useEffect(() => {
    retryCountRef.current = 0; // Reset teller bij wijziging van inlogstatus
    if (user) startRealtime();
    else stopRealtime();
    return () => stopRealtime();
  }, [user, startRealtime, stopRealtime]);

  // Synchroniseert automatisch zodra de verbinding terugkomt — zonder dit
  // bleef de offline-queue staan tot de gebruiker zelf terugkwam in de app
  // of handmatig syncNu() aanriep (zie SyncStatusBar.jsx), wat in een
  // buitengebied met wisselende dekking een melding "verloren" kan laten
  // voelen terwijl hij gewoon lokaal klaarstaat.
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => { syncNu(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, syncNu]);

  return {
    syncBezig,
    syncStatus,
    syncNu,
    laadVanCloud,
    startRealtime,
    stopRealtime
  };
}

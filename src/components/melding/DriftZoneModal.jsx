import { useEffect, useRef } from 'react';
import { driftZones, focusDriftPct, windFactor } from '../../lib/drift/driftzone.js';
import { degToCompass } from '../../lib/drift/oordeel.js';
import { DriftZoneKaart } from './DriftZoneKaart.jsx';
import './DriftZoneModal.css';

// React-versie van toonDriftZoneModal() uit docs/index.html.
export function DriftZoneModal({ melding, onClose }) {
  const sluitRef = useRef(null);
  useEffect(() => { sluitRef.current?.focus(); }, []);
  const windDir = melding.weather?.wind_dir;
  const windKmh = melding.weather?.wind_speed;

  if (!melding.gps?.lat || !melding.gps?.lng || windDir == null) return null;

  const zones = driftZones(windKmh || 5);
  const datum = new Date(melding.timestamp_local).toLocaleString('nl-NL');

  return (
    <div className="driftzone-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="driftzone-modal" role="dialog" aria-modal="true" aria-label="Driftzone">
        <button ref={sluitRef} type="button" className="driftzone-close" onClick={onClose} aria-label="Sluiten">✕</button>
        <div className="driftzone-title">🌬️ Driftzone Analyse</div>
        <div className="driftzone-datum">{datum}</div>

        <DriftZoneKaart melding={melding} hoogte={280} />

        <div className="driftzone-info">
          💨 Wind: {windKmh ?? '?'} km/h uit {degToCompass(windDir)} ({windDir}°)
          {melding.perceelnummer ? ` · 📋 ${melding.perceelnummer}` : ''}
        </div>
        <div className="driftzone-model-note">FOCUS STEP model · grondspuit · geen driftreductie aangenomen</div>

        <div className="driftzone-zones">
          {zones.map((z) => (
            <div key={z.naam} className="driftzone-zone" style={{ background: `${z.kleur}22`, border: `1px solid ${z.kleur}55` }}>
              <div className="driftzone-zone-label" style={{ color: z.kleur }}>≤ {z.reikwijdteM}m</div>
              <div className="driftzone-zone-sub">{z.naam} (&gt;{z.minPct}%)</div>
            </div>
          ))}
        </div>

        {melding.afstand_woning != null && (
          <div className="driftzone-woning">
            <div className="driftzone-woning-titel">🏠 Dichtstbijzijnde woning: {melding.afstand_woning}m</div>
            <div className="driftzone-woning-detail">
              Drift op woningafstand: ~{(focusDriftPct(melding.afstand_woning) * windFactor(windKmh || 5)).toFixed(2)}% (gecorrigeerd voor windsnelheid)
            </div>
          </div>
        )}

        <div className="driftzone-disclaimer">
          ⚠️ Dit is een indicatieve visualisatie op basis van het EU FOCUS STEP model voor grondspuit. Werkelijke drift hangt af van spuitdop, rijsnelheid, boomhoogte en meteorologische omstandigheden. Gebruik dit als ondersteuning voor dossieropbouw, niet als exacte meting.
        </div>
      </div>
    </div>
  );
}

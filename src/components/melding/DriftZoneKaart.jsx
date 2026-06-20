import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { driftZones, driftKegel } from '../../lib/drift/driftzone.js';
import { degToCompass } from '../../lib/drift/oordeel.js';

// Komt overeen met maakDriftZoneLayer() uit docs/index.html — tekent de
// FOCUS STEP driftzones + windpijl-label op een Leaflet-laag.
function maakDriftZoneLayer(melding) {
  const lat = melding.gps?.lat;
  const lng = melding.gps?.lng;
  const windDir = melding.weather?.wind_dir;
  const windKmh = melding.weather?.wind_speed;

  if (!lat || !lng || windDir == null) return null;

  const groep = L.layerGroup();
  const zones = driftZones(windKmh || 5);

  [...zones].reverse().forEach((zone) => {
    const punten = driftKegel(lat, lng, windDir, zone.reikwijdteM);
    L.polygon(punten, {
      color: zone.kleur,
      fillColor: zone.kleur,
      fillOpacity: zone.alpha * 0.7,
      weight: 1,
      opacity: 0.5,
      dashArray: zone.naam === 'laag' ? '4,4' : null,
      interactive: false
    }).addTo(groep);
  });

  L.circleMarker([lat, lng], {
    radius: 5, color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 2
  }).addTo(groep);

  const windLabel = windKmh
    ? `💨 ${windKmh} km/h uit ${degToCompass(windDir)}`
    : `Windrichting: ${degToCompass(windDir)}`;

  L.marker([lat, lng], {
    icon: L.divIcon({
      html: `<div style="background:rgba(0,0,0,0.75);color:#fff;font-family:monospace;font-size:10px;padding:3px 6px;border-radius:4px;white-space:nowrap;">${windLabel}</div>`,
      className: '',
      iconAnchor: [-8, 10]
    })
  }).addTo(groep);

  return groep;
}

// React-versie van de mini-kaart in showMeldingDetail() / toonDriftZoneModal()
// uit docs/index.html. Toont alleen een locatiepin als er geen winddata is.
export function DriftZoneKaart({ melding, hoogte = 200 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !melding.gps?.lat || !melding.gps?.lng) return;

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
      .setView([melding.gps.lat, melding.gps.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const driftLaag = maakDriftZoneLayer(melding);
    if (driftLaag) {
      driftLaag.addTo(map);
    } else {
      L.circleMarker([melding.gps.lat, melding.gps.lng], {
        radius: 7, color: '#fff', fillColor: '#f59e0b', fillOpacity: 1, weight: 2
      }).addTo(map);
    }

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [melding.id]);

  if (!melding.gps?.lat || !melding.gps?.lng) return null;

  return <div ref={containerRef} style={{ height: hoogte, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }} />;
}

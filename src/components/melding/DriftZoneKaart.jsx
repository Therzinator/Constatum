import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { maakDriftZoneLayer } from '../../lib/drift/driftzone.js';

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

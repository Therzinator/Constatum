import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { maakDriftZoneLayer } from '../../lib/drift/driftzone.js';
import { gebruikerKleur, melderCode } from '../../utils/format.js';
import './DashboardKaart.css';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const LUCHTFOTO_URL =
  'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Actueel_ortho25&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png';

const TYPE_KLEUREN = {
  spuitactiviteit: '#f59e0b',
  drift: '#3b82f6',
  geur: '#8b5cf6',
  gezondheid: '#ef4444',
  geluid: '#f97316',
  overig: '#6b7280'
};

const MAAND_OPTIES = [
  ['huidig', 'Deze maand'], ['', 'Alle maanden'], ['01', 'Januari'], ['02', 'Februari'], ['03', 'Maart'],
  ['04', 'April'], ['05', 'Mei'], ['06', 'Juni'], ['07', 'Juli'], ['08', 'Augustus'],
  ['09', 'September'], ['10', 'Oktober'], ['11', 'November'], ['12', 'December']
];

// Komt overeen met initDashMap()/updateDashboard() (kaartgedeelte) uit
// docs/index.html: meldingmarkers + driftzones op een kaart met
// luchtfoto/driftlaag-toggle en maand/jaar-filter.
export function DashboardKaart({ meldingen, thuislocatie, onMeldingSelecteren }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLaagRef = useRef(null);
  const driftLaagRef = useRef(null);
  const osmLaagRef = useRef(null);
  const luchtLaagRef = useRef(null);
  const [luchtAan, setLuchtAan] = useState(false);
  const [driftAan, setDriftAan] = useState(false);
  const [maandFilter, setMaandFilter] = useState('huidig');
  const [jaarFilter, setJaarFilter] = useState('');

  const jaren = useMemo(
    () => [...new Set(meldingen.map((m) => new Date(m.timestamp_local).getFullYear()))].sort((a, b) => b - a),
    [meldingen]
  );

  const gefiltered = useMemo(() => {
    const now = new Date();
    return meldingen.filter((m) => {
      const d = new Date(m.timestamp_local);
      if (maandFilter === 'huidig') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (maandFilter && String(d.getMonth() + 1).padStart(2, '0') !== maandFilter) {
        return false;
      }
      if (jaarFilter && String(d.getFullYear()) !== jaarFilter) return false;
      return true;
    });
  }, [meldingen, maandFilter, jaarFilter]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const lat = thuislocatie?.lat ?? 52.3676;
    const lng = thuislocatie?.lng ?? 5.2006;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([lat, lng], 13);
    const osmLaag = L.tileLayer(OSM_URL, { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    const luchtLaag = L.tileLayer(LUCHTFOTO_URL, { attribution: '© PDOK Luchtfoto', maxZoom: 19, tileSize: 256 });
    osmLaagRef.current = osmLaag;
    luchtLaagRef.current = luchtLaag;

    const homeIcon = L.divIcon({
      html: '<div style="width:16px;height:16px;background:#00d4aa;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(0,212,170,0.5);"></div>',
      iconSize: [16, 16], className: ''
    });
    L.marker([lat, lng], { icon: homeIcon }).addTo(map).bindPopup('🏠 ' + (thuislocatie?.label || 'Thuislocatie'));

    markersLaagRef.current = L.layerGroup().addTo(map);
    driftLaagRef.current = L.layerGroup();

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLaagRef.current = null;
      driftLaagRef.current = null;
      osmLaagRef.current = null;
      luchtLaagRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers + driftzones hertekenen bij gefilterde meldingen
  useEffect(() => {
    const map = mapRef.current;
    const markersLaag = markersLaagRef.current;
    const driftLaag = driftLaagRef.current;
    if (!map || !markersLaag || !driftLaag) return;

    markersLaag.clearLayers();
    driftLaag.clearLayers();
    if (map.hasLayer(driftLaag)) map.removeLayer(driftLaag);

    gefiltered.slice(0, 100).forEach((m) => {
      if (!m.gps?.lat || !m.gps?.lng) return;
      if (Math.abs(m.gps.lat) < 0.01 && Math.abs(m.gps.lng) < 0.01) return;
      const typeKleur = TYPE_KLEUREN[m.type] || '#6b7280';
      const randKleur = gebruikerKleur(m.melder_email);
      const d = new Date(m.timestamp_local);
      const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const icon = L.divIcon({
        html: `<div style="position:relative;display:inline-block;">
          <div style="width:10px;height:10px;background:${typeKleur};border-radius:50%;border:2px solid ${randKleur};opacity:0.9;box-shadow:0 0 3px ${randKleur}88;"></div>
          <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:'JetBrains Mono',monospace;font-size:5px;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.9),0 0 4px rgba(0,0,0,0.7);">${dateLabel}</div>
        </div>`,
        iconSize: [10, 10], iconAnchor: [5, 5], className: ''
      });
      const marker = L.marker([m.gps.lat, m.gps.lng], { icon });
      marker.on('click', () => onMeldingSelecteren(m.id));
      markersLaag.addLayer(marker);

      if (m.weather?.wind_dir != null && (m.type === 'spuitactiviteit' || m.type === 'drift')) {
        const laag = maakDriftZoneLayer(m);
        if (laag) driftLaag.addLayer(laag);
      }
    });

    if (driftAan) driftLaag.addTo(map);
  }, [gefiltered, driftAan, onMeldingSelecteren]);

  const wisselLuchtfoto = () => {
    const map = mapRef.current;
    if (!map) return;
    if (luchtAan) {
      map.removeLayer(luchtLaagRef.current);
      osmLaagRef.current.addTo(map);
    } else {
      map.removeLayer(osmLaagRef.current);
      luchtLaagRef.current.addTo(map);
    }
    setLuchtAan(!luchtAan);
  };

  const wisselDriftLaag = () => {
    const map = mapRef.current;
    const driftLaag = driftLaagRef.current;
    const volgende = !driftAan;
    setDriftAan(volgende);
    if (!map || !driftLaag) return;
    if (volgende) map.addLayer(driftLaag);
    else map.removeLayer(driftLaag);
  };

  const melders = useMemo(
    () => [...new Set(gefiltered.map((m) => m.melder_email).filter(Boolean))],
    [gefiltered]
  );

  return (
    <div className="dashboard-kaart-wrap">
      <div className="dashboard-kaart-balk">
        <select className="dashboard-kaart-select" value={maandFilter} onChange={(e) => setMaandFilter(e.target.value)}>
          {MAAND_OPTIES.map(([waarde, label]) => <option key={waarde} value={waarde}>{label}</option>)}
        </select>
        <select className="dashboard-kaart-select" value={jaarFilter} onChange={(e) => setJaarFilter(e.target.value)}>
          <option value="">Alle jaren</option>
          {jaren.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <button type="button" className={`dashboard-kaart-toggle ${luchtAan ? 'actief-lucht' : ''}`} onClick={wisselLuchtfoto}>
          {luchtAan ? '🗺️ Kaart' : '🛰️ Luchtfoto'}
        </button>
        <button type="button" className={`dashboard-kaart-toggle ${driftAan ? 'actief-drift' : ''}`} onClick={wisselDriftLaag}>
          🌬️ Driftzone{driftAan ? ' aan' : ''}
        </button>
      </div>

      <div ref={containerRef} className="dashboard-kaart" />

      {melders.length > 0 && (
        <div className="dashboard-kaart-legenda">
          {melders.map((email) => (
            <span key={email} className="dashboard-kaart-legenda-item">
              <span className="dashboard-kaart-legenda-dot" style={{ border: `2px solid ${gebruikerKleur(email)}` }} />
              {melderCode(email)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

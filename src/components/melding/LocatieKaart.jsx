import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { degToCompass } from '../../lib/drift/oordeel.js';
import './LocatieKaart.css';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const LUCHTFOTO_URL =
  'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Actueel_ortho25&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png';

const homeIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#00d4aa;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,212,170,0.5);"></div>',
  iconSize: [14, 14],
  className: ''
});

const meldIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(245,158,11,0.5);"></div>',
  iconSize: [14, 14],
  className: ''
});

// Eigen GPS-positie van de melder — los van de (verplaatsbare) meldingspin,
// die immers kan staan op het waargenomen perceel terwijl de melder zelf
// elders staat.
const gebruikerIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>',
  iconSize: [14, 14],
  className: ''
});

// Komt overeen met updateFormMarkerWindPopup() — toont windrichting/-kracht
// als popup direct bij de meldingspin, met een eigen sluit-kruisje (net als
// sluitWindPopup() in docs/index.html — een eigen icoon i.p.v. Leaflets
// standaard close-knop, die onbetrouwbaar samenwerkt met een draggable marker).
function windPopupHtml(weather) {
  const deg = weather.wind_dir ?? 0;
  const speed = weather.wind_speed ?? '?';
  const gusts = weather.wind_gusts ?? '?';
  const label = degToCompass(deg);
  const arrowSvg = `<svg width="36" height="36" viewBox="0 0 36 36" style="display:block;margin:0 auto 4px;">
    <circle cx="18" cy="18" r="16" fill="rgba(0,212,170,0.12)" stroke="rgba(0,212,170,0.5)" stroke-width="1.5"/>
    <g transform="rotate(${deg},18,18)">
      <polygon points="18,5 14,22 18,19 22,22" fill="#00d4aa"/>
      <polygon points="18,31 14,14 18,17 22,14" fill="rgba(0,212,170,0.3)"/>
    </g>
    <circle cx="18" cy="18" r="2.5" fill="#00d4aa"/>
  </svg>`;
  return `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;text-align:center;min-width:110px;position:relative;">
    <div class="wind-popup-close" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:rgba(100,116,139,0.25);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;line-height:1;" title="Sluiten">×</div>
    ${arrowSvg}
    <div style="font-weight:700;color:#00d4aa;">${label} · ${deg}°</div>
    <div style="color:#7a90b0;margin-top:2px;">${speed} km/h · vlagen ${gusts} km/h</div>
    <div style="color:#4a5568;font-size:9px;margin-top:2px;">windrichting nu</div>
  </div>`;
}

// React-versie van initFormMap() uit docs/index.html — kaart met thuislocatie,
// een verplaatsbare meldingspin (oranje) én de eigen, live GPS-positie van de
// melder (blauw) — bewust twee afzonderlijke markers, want de melding kan op
// een ander punt staan (bv. het waargenomen perceel) dan waar de melder zelf
// staat. `lat`/`lng` zijn de huidige meldingscoördinaten, `weather` (optioneel)
// toont windrichting/-kracht als popup bij de meldingspin,
// `onLocatieGewijzigd(lat, lng)` wordt aangeroepen bij klikken/verschuiven van die pin.
export function LocatieKaart({ lat, lng, homeLocatie, weather, onLocatieGewijzigd }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const osmLaagRef = useRef(null);
  const luchtLaagRef = useRef(null);
  const gebruikerMarkerRef = useRef(null);
  const gebruikerCirkelRef = useRef(null);
  const [kaartModus, setKaartModus] = useState('osm'); // 'osm' | 'lucht'
  const [gpsBeschikbaar, setGpsBeschikbaar] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false }).setView([lat, lng], 15);
    const osmLaag = L.tileLayer(OSM_URL, { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    const luchtLaag = L.tileLayer(LUCHTFOTO_URL, { attribution: '© PDOK Luchtfoto', maxZoom: 19, tileSize: 256 });
    osmLaagRef.current = osmLaag;
    luchtLaagRef.current = luchtLaag;

    if (homeLocatie?.lat && homeLocatie?.lng) {
      L.marker([homeLocatie.lat, homeLocatie.lng], { icon: homeIcon })
        .addTo(map)
        .bindPopup('🏠 ' + (homeLocatie.label || 'Thuislocatie'));
    }

    const marker = L.marker([lat, lng], { icon: meldIcon, draggable: true }).addTo(map);
    const popup = L.popup({ closeButton: false, offset: [0, -8] });
    marker.bindPopup(popup);

    // Wiring van het eigen sluit-kruisje — popup-element kan na elke setContent
    // hetzelfde blijven, dus we koppelen de click-handler opnieuw bij elke opening
    marker.on('popupopen', () => {
      const el = popup.getElement();
      const closeBtn = el?.querySelector('.wind-popup-close');
      if (closeBtn) {
        closeBtn.onclick = (ev) => {
          ev.stopPropagation();
          marker.closePopup();
        };
      }
    });

    // Alleen het zelf prikken/verslepen van de pin triggert de windpopup —
    // de GPS-positie van de melder (verversGPS) doet dat bewust niet.
    marker.on('dragend', (e) => {
      const p = e.target.getLatLng();
      onLocatieGewijzigd(p.lat, p.lng, { metWeer: true });
    });
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onLocatieGewijzigd(e.latlng.lat, e.latlng.lng, { metWeer: true });
    });

    if (weather) {
      popup.setContent(windPopupHtml(weather));
      marker.openPopup();
    }

    mapRef.current = map;
    markerRef.current = marker;
    popupRef.current = popup;

    setTimeout(() => map.invalidateSize(), 100);

    // Eigen GPS-positie van de melder — los van de meldingspin, continu
    // bijgewerkt zolang het formulier open staat.
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          if (!mapRef.current) return;
          if (!gebruikerMarkerRef.current) {
            gebruikerMarkerRef.current = L.marker([latitude, longitude], { icon: gebruikerIcon, zIndexOffset: -100 })
              .addTo(mapRef.current)
              .bindPopup('📍 Jouw GPS-locatie');
            gebruikerCirkelRef.current = L.circle([latitude, longitude], {
              radius: accuracy || 0,
              color: '#3b82f6',
              weight: 1,
              fillColor: '#3b82f6',
              fillOpacity: 0.08
            }).addTo(mapRef.current);
          } else {
            gebruikerMarkerRef.current.setLatLng([latitude, longitude]);
            gebruikerCirkelRef.current.setLatLng([latitude, longitude]).setRadius(accuracy || 0);
          }
          setGpsBeschikbaar(true);
        },
        (err) => console.warn('[LocatieKaart] GPS van melder niet beschikbaar:', err.message),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      popupRef.current = null;
      osmLaagRef.current = null;
      luchtLaagRef.current = null;
      gebruikerMarkerRef.current = null;
      gebruikerCirkelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Komt overeen met toggleFormKaartLaag() — wisselt tussen stratenkaart en PDOK-luchtfoto
  const wisselKaartLaag = () => {
    if (!mapRef.current) return;
    if (kaartModus === 'osm') {
      mapRef.current.removeLayer(osmLaagRef.current);
      luchtLaagRef.current.addTo(mapRef.current);
      setKaartModus('lucht');
    } else {
      mapRef.current.removeLayer(luchtLaagRef.current);
      osmLaagRef.current.addTo(mapRef.current);
      setKaartModus('osm');
    }
  };

  // Centreert de kaartweergave op de eigen GPS-positie van de melder (blauwe
  // marker) — verplaatst bewust NIET de meldingspin, die mag alleen de
  // gebruiker zelf zetten via klikken/slepen op de kaart.
  const centreerOpGPS = () => {
    if (!mapRef.current || !gebruikerMarkerRef.current) return;
    mapRef.current.setView(gebruikerMarkerRef.current.getLatLng(), 16);
  };

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  // Volgt externe lat/lng-wijzigingen (bv. na GPS-detectie) zonder dragend/click te triggeren
  useEffect(() => {
    if (!markerRef.current || lat == null || lng == null) return;
    const huidige = markerRef.current.getLatLng();
    if (Math.abs(huidige.lat - lat) > 1e-9 || Math.abs(huidige.lng - lng) > 1e-9) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current?.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  // Werkt de windpopup bij zodra weerdata (opnieuw) beschikbaar komt — opent
  // de popup opnieuw met de nieuwe waarden (de gebruiker kan die altijd weer
  // sluiten via het kruisje).
  useEffect(() => {
    if (!markerRef.current || !popupRef.current || !weather) return;
    popupRef.current.setContent(windPopupHtml(weather));
    markerRef.current.openPopup();
  }, [weather]);

  return (
    <div className="locatie-kaart-wrap">
      <div ref={containerRef} className="locatie-kaart" />
      <button type="button" className="locatie-kaart-laag-btn" onClick={wisselKaartLaag}>
        {kaartModus === 'osm' ? '🛰️ Luchtfoto' : '🗺️ Kaart'}
      </button>
      <button
        type="button"
        className="locatie-kaart-gps-btn"
        onClick={centreerOpGPS}
        disabled={!gpsBeschikbaar}
        title="Centreer kaart op jouw GPS-locatie"
      >
        📍 GPS
      </button>
      <div className="locatie-kaart-zoom">
        <button type="button" onClick={zoomIn} title="Inzoomen" aria-label="Inzoomen">+</button>
        <button type="button" onClick={zoomOut} title="Uitzoomen" aria-label="Uitzoomen">−</button>
      </div>
    </div>
  );
}

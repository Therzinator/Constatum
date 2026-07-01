import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Feature from 'ol/Feature.js';
import { Point } from 'ol/geom.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import Style from 'ol/style/Style.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import 'ol/ol.css';
import { maakOsmLaag } from '../../lib/ol/lagen.js';
import './GroepDashboardKaart.css';

// Zelfde kleuren-per-type als MeldingCard.jsx/DashboardKaart.jsx (bewust
// gedupliceerd, geen gedeelde module, zie CURRENT_STATE.md).
const TYPE_KLEUR = {
  spuitactiviteit: '#f59e0b',
  drift: '#3b82f6',
  geur: '#8b5cf6',
  gezondheid: '#ef4444',
  geluid: '#f97316',
  overig: '#6b7280'
};

// Lichte, groepsveilige kaartweergave — GEEN hergebruik van
// DashboardKaart.jsx/MeldingDetailModal.jsx (die tonen hash/RFC3161/
// device-detail dat een lage-trust-groepslid niet mag zien, zie
// DECISIONS.md). Krijgt alleen de al door GroepMeldingenLijst.jsx
// geredigeerde meldingen (`toon`-gate uit trustZichtbaarheid.js al
// toegepast) — een melding zonder zichtbare `gps` (exacteLocatie niet
// toegestaan voor deze kijker) wordt hier simpelweg niet geplot, net
// zoals DashboardKaart.jsx meldingen zonder coördinaten al oversloeg.
// Geen luchtfoto/driftzone/Natura2000/percelen-lagen of clustering —
// bewust minimaal, vergelijkbaar met hoe GroepMeldingDetailModal een
// "lichtere" variant is van MeldingDetailModal.
export function GroepDashboardKaart({ meldingen, onMeldingSelecteren }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const meldingenMetLocatie = meldingen.filter((m) => m.gps?.lat != null && m.gps?.lng != null);

  useEffect(() => {
    if (!containerRef.current || meldingenMetLocatie.length === 0) return;

    const source = new VectorSource();
    meldingenMetLocatie.forEach((m) => {
      const feature = new Feature({ geometry: new Point(fromLonLat([m.gps.lng, m.gps.lat])) });
      feature.set('melding', m);
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: TYPE_KLEUR[m.type] || TYPE_KLEUR.overig }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      }));
      source.addFeature(feature);
    });

    const laag = new VectorLayer({ source });

    const gemLat = meldingenMetLocatie.reduce((s, m) => s + m.gps.lat, 0) / meldingenMetLocatie.length;
    const gemLng = meldingenMetLocatie.reduce((s, m) => s + m.gps.lng, 0) / meldingenMetLocatie.length;

    const map = new Map({
      target: containerRef.current,
      layers: [maakOsmLaag(), laag],
      view: new View({ center: fromLonLat([gemLng, gemLat]), zoom: 12 })
    });

    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) onMeldingSelecteren(feature.get('melding'));
    });

    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapRef.current = map;
    const invalidateTimer = setTimeout(() => map.updateSize(), 100);

    return () => {
      clearTimeout(invalidateTimer);
      map.setTarget(null);
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- meldingenMetLocatie is een afgeleide array, opnieuw aanmaken bij een andere set is bedoeld gedrag
  }, [meldingenMetLocatie.map((m) => m.id).join(',')]);

  if (meldingenMetLocatie.length === 0) {
    return (
      <div className="groep-dashboard-kaart-leeg">
        Geen meldingen met een zichtbare locatie in deze groep — dit hangt af van je eigen zichtbaarheidsniveau.
      </div>
    );
  }

  return (
    <div className="groep-dashboard-kaart-wrap">
      <div className="groep-dashboard-kaart" ref={containerRef} />
    </div>
  );
}

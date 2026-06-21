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
import Text from 'ol/style/Text.js';
import { maakOsmLaag } from '../ol/lagen.js';
import { maakDriftZoneLayer } from '../drift/driftzone.js';

const BREEDTE = 680;
const HOOGTE = 420;

// kwetsbare_locaties wordt als kant-en-klare, geformatteerde regel
// opgeslagen (zie lib/pdok/kwetsbareLocaties.js::formatLocatieCategorie) —
// geen los datamodel. Voor de kaartmarkers hier dus terugparsen uit die
// tekst i.p.v. een herontwerp van hoe die data wordt opgeslagen.
function parseKwetsbareLocatieRegel(regel) {
  const match = regel.match(/^(.+?)\s—\s(\d+)m(?:\s·\s📍\s(-?[\d.]+)°N\s·\s(-?[\d.]+)°E)?\s*$/u);
  if (!match) return null;
  const [, titel, afstandM, lat, lng] = match;
  if (lat == null || lng == null) return null;
  return { titel, afstandM: Number(afstandM), lat: Number(lat), lng: Number(lng) };
}

function puntFeature(coord, kleur, label) {
  const feature = new Feature({ geometry: new Point(coord) });
  feature.setStyle(
    new Style({
      image: new CircleStyle({ radius: 6, fill: new Fill({ color: kleur }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
      text: new Text({
        text: label,
        font: '10px sans-serif',
        offsetY: -14,
        fill: new Fill({ color: '#fff' }),
        backgroundFill: new Fill({ color: 'rgba(0,0,0,0.7)' }),
        padding: [2, 5, 2, 5]
      })
    })
  );
  return feature;
}

// Standaard OL-recept om de huidige kaartweergave als PNG-dataURL te
// exporteren (canvas-per-laag samenvoegen) — zie OL's "Export Map" voorbeeld.
function exporteerAlsDataURL(map) {
  return new Promise((resolve) => {
    map.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas');
      const size = map.getSize();
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      const mapContext = mapCanvas.getContext('2d');
      map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer').forEach((canvas) => {
        if (canvas.width === 0) return;
        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
        const matrix = canvas.style.transform?.match(/^matrix\(([^)]*)\)$/)?.[1]?.split(',').map(Number);
        if (matrix) mapContext.setTransform(...matrix);
        mapContext.drawImage(canvas, 0, 0);
      });
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      resolve(mapCanvas.toDataURL('image/png'));
    });
    map.renderSync();
  });
}

// Genereert een statische kaartafbeelding (PNG-dataURL) van de melding:
// windvector-driftkegel (zie driftzone.js), Natura2000 en kwetsbare locaties
// (woon/zorg/onderwijs/speeltuin) als gelabelde punten. Wordt vóór het
// openen van het PDF-printvenster aangeroepen (zie export/pdf.js) — die
// pagina is statische HTML zonder React/OL, dus de kaart moet hier al
// "bevroren" worden tot een afbeelding.
export async function genereerMeldingKaartAfbeelding(melding) {
  const lat = melding.gps?.lat;
  const lng = melding.gps?.lng;
  if (lat == null || lng == null) return null;

  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.left = '-9999px';
  host.style.top = '0';
  host.style.width = `${BREEDTE}px`;
  host.style.height = `${HOOGTE}px`;
  document.body.appendChild(host);

  try {
    const centrum = fromLonLat([lng, lat]);
    const driftLaag = maakDriftZoneLayer(melding);

    const puntenSource = new VectorSource();
    const extentCoords = [centrum];

    if (!driftLaag) {
      puntenSource.addFeature(puntFeature(centrum, '#ef4444', '🚜 Spuitactiviteit'));
    }

    if (melding.natura2000?.lat != null && melding.natura2000?.lng != null) {
      const coord = fromLonLat([melding.natura2000.lng, melding.natura2000.lat]);
      puntenSource.addFeature(puntFeature(coord, '#22c55e', `🌳 ${melding.natura2000.naam}`));
      extentCoords.push(coord);
    }

    if (melding.afstand_woning_lat != null && melding.afstand_woning_lng != null) {
      const coord = fromLonLat([melding.afstand_woning_lng, melding.afstand_woning_lat]);
      puntenSource.addFeature(puntFeature(coord, '#3b82f6', `🏠 Woning — ${melding.afstand_woning}m`));
      extentCoords.push(coord);
    }

    (melding.kwetsbare_locaties || []).forEach((regel) => {
      const item = parseKwetsbareLocatieRegel(regel);
      if (!item) return;
      const coord = fromLonLat([item.lng, item.lat]);
      puntenSource.addFeature(puntFeature(coord, '#f59e0b', `${item.titel} — ${item.afstandM}m`));
      extentCoords.push(coord);
    });

    const puntenLaag = new VectorLayer({ source: puntenSource });
    const map = new Map({
      target: host,
      controls: [],
      pixelRatio: 1,
      layers: [maakOsmLaag(), ...(driftLaag ? [driftLaag] : []), puntenLaag],
      view: new View({ center: centrum, zoom: 17 })
    });

    map.setSize([BREEDTE, HOOGTE]);
    if (extentCoords.length > 1) {
      const xs = extentCoords.map((c) => c[0]);
      const ys = extentCoords.map((c) => c[1]);
      map.getView().fit([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], {
        padding: [40, 40, 40, 40],
        maxZoom: 18
      });
    }

    return await exporteerAlsDataURL(map);
  } finally {
    document.body.removeChild(host);
  }
}

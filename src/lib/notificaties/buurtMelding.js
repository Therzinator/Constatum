import { haversineAfstand } from '../geo/haversine.js';

export const STANDAARD_RADIUS_METER = 5000;
export const RADIUS_OPTIES = [1000, 2500, 5000, 10000, 25000];

const SLEUTEL_AAN = 'spuitlog_notificatie_aan';
const SLEUTEL_RADIUS = 'spuitlog_notificatie_radius';

export function laadNotificatieInstellingen() {
  let aan = false;
  let radiusMeter = STANDAARD_RADIUS_METER;
  try {
    aan = localStorage.getItem(SLEUTEL_AAN) === 'true';
  } catch { /* localStorage niet beschikbaar */ }
  try {
    const opgeslagen = parseInt(localStorage.getItem(SLEUTEL_RADIUS), 10);
    if (RADIUS_OPTIES.includes(opgeslagen)) radiusMeter = opgeslagen;
  } catch { /* localStorage niet beschikbaar */ }
  return { aan, radiusMeter };
}

export function slaNotificatieInstellingenOp({ aan, radiusMeter }) {
  try {
    localStorage.setItem(SLEUTEL_AAN, String(aan));
    localStorage.setItem(SLEUTEL_RADIUS, String(radiusMeter));
  } catch { /* localStorage niet beschikbaar */ }
}

// Bepaalt of een nieuwe entry binnen het ingestelde bereik van de thuislocatie valt.
// Geeft de afstand in meters terug, of null als buiten bereik / geen geldige coördinaten.
export function afstandBinnenBereik(entry, thuislocatie, radiusMeter) {
  if (!thuislocatie?.lat || !thuislocatie?.lng) return null;
  if (entry?.gps_lat == null || entry?.gps_lng == null) return null;
  const afstand = haversineAfstand(thuislocatie.lat, thuislocatie.lng, entry.gps_lat, entry.gps_lng);
  return afstand <= radiusMeter ? afstand : null;
}

export function formatNotificatieTekst(entry, afstandMeter) {
  const afstandTekst = afstandMeter >= 1000
    ? `${(afstandMeter / 1000).toFixed(1)} km`
    : `${Math.round(afstandMeter)} m`;
  const type = entry?.type || 'melding';
  return {
    titel: `Nieuwe melding op ${afstandTekst}`,
    tekst: `Type: ${type}${entry?.bedrijfsnaam ? ` — ${entry.bedrijfsnaam}` : ''}`
  };
}

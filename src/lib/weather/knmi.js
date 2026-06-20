import { haversineAfstand } from '../geo/haversine.js';

const SLEUTEL = 'spuitlog_knmi_key';

export function laadKNMIKey() {
  try {
    return localStorage.getItem(SLEUTEL) || '';
  } catch {
    return '';
  }
}

export function slaKNMIKeyOp(key) {
  try {
    if (key) localStorage.setItem(SLEUTEL, key);
    else localStorage.removeItem(SLEUTEL);
  } catch { /* localStorage niet beschikbaar */ }
}

// Komt overeen met haalKNMIWeerdata() uit docs/index.html — EDR API:
// dichtstbijzijnd station + observaties rond het opgegeven tijdstip.
// `apiKey` wordt expliciet meegegeven (i.p.v. direct uit localStorage
// gelezen) zodat dit een pure, testbare functie blijft.
export async function haalKNMIWeerdata(lat, lng, isoDatetime, apiKey) {
  if (!apiKey) return null;
  const key = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;

  try {
    const locUrl = `https://api.dataplatform.knmi.nl/edr/collections/10-minute-in-situ-meteorological-observations/locations?bbox=${lng - 0.5},${lat - 0.5},${lng + 0.5},${lat + 0.5}`;
    const locRes = await fetch(locUrl, { headers: { Authorization: key } });
    if (!locRes.ok) return null;
    const locData = await locRes.json();
    const stations = locData.features || [];
    if (!stations.length) return null;

    let dichtstbij = null;
    let minDist = Infinity;
    stations.forEach((s) => {
      const [sLng, sLat] = s.geometry.coordinates;
      const d = haversineAfstand(lat, lng, sLat, sLng);
      if (d < minDist) { minDist = d; dichtstbij = s; }
    });
    if (!dichtstbij) return null;

    const stationId = dichtstbij.id;
    const stationNaam = dichtstbij.properties?.name || stationId;
    const stationAfst = Math.round((minDist / 1000) * 10) / 10; // km

    const dt = new Date(isoDatetime);
    const van = new Date(dt.getTime() - 10 * 60000).toISOString().replace('.000Z', 'Z');
    const tot = new Date(dt.getTime() + 10 * 60000).toISOString().replace('.000Z', 'Z');
    const obsUrl = `https://api.dataplatform.knmi.nl/edr/collections/10-minute-in-situ-meteorological-observations/locations/${stationId}?datetime=${van}/${tot}&parameter-name=wind_speed,wind_direction,air_temperature,relative_humidity,precipitation_duration`;
    const obsRes = await fetch(obsUrl, { headers: { Authorization: key } });
    if (!obsRes.ok) return null;
    const obsData = await obsRes.json();

    const params = obsData.ranges || {};
    const getValue = (param) => {
      const vals = params[param]?.values;
      return vals?.length ? vals[vals.length - 1] : null;
    };

    return {
      station: stationNaam,
      stationId,
      afstand_km: stationAfst,
      windsnelheid: getValue('wind_speed'),
      windrichting: getValue('wind_direction'),
      temperatuur: getValue('air_temperature'),
      luchtvochtigheid: getValue('relative_humidity'),
      neerslag: getValue('precipitation_duration'),
      bron: 'KNMI Open Data (CC BY 4.0)',
      tijdstip: isoDatetime
    };
  } catch (e) {
    console.warn('[KNMI] Weerdata ophalen mislukt:', e.message);
    return null;
  }
}

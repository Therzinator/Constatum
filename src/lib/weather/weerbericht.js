import { haversineAfstand } from '../geo/haversine.js';

// Eén geheel: alle weerinformatie op de dashboardkaart komt uit Buienradar's
// gratis, sleutelloze publieke data (zie buienradar.nl/overbuienradar/
// gratis-weerdata) — niet langer een mix van RainViewer/Open-Meteo/
// Buienradar naast elkaar. Twee endpoints:
// - raintext: neerslag-nowcast per 5 minuten, ~2 uur vooruit (vaste horizon
//   van deze gratis databron — er bestaat geen langere gratis neerslag-
//   nowcast, vandaar dat ALLE voorspellingen hieronder ook op 2 uur staan)
// - feed/json: actuele stationsmetingen (wind/luchtdruk/zonkracht) van het
//   dichtstbijzijnde meetstation — geen forecast-array, dus dit zijn altijd
//   actuele waarnemingen, niet "verwacht over X uur".
const RAINTEXT_URL = 'https://gpsgadget.buienradar.nl/data/raintext';
const FEED_URL = 'https://data.buienradar.nl/2.0/feed/json';

// Buienradar codeert neerslagintensiteit logaritmisch 0-255: 0 = droog,
// 255 ≈ stortbui. Omrekening naar mm/u volgens Buienradar's eigen formule.
function naarMmPerUur(waarde) {
  if (waarde <= 0) return 0;
  return Math.round(10 ** ((waarde - 109) / 32) * 100) / 100;
}

function parseRegenRegel(regel, nu) {
  const [waardeStr, tijdStr] = regel.split('|');
  const [uur, minuut] = tijdStr.split(':').map(Number);
  const tijd = new Date(nu);
  tijd.setHours(uur, minuut, 0, 0);
  // Buienradar geeft alleen HH:mm — als de eerste stap "in het verleden"
  // lijkt (bv. 23:55 terwijl nu 00:02 is) is het etmaal omgeslagen.
  if (tijd.getTime() < nu.getTime() - 10 * 60 * 1000) tijd.setDate(tijd.getDate() + 1);
  return { tijd, mmPerUur: naarMmPerUur(Number(waardeStr)) };
}

async function haalRegenreeks(lat, lng) {
  const url = `${RAINTEXT_URL}?lat=${lat.toFixed(2)}&lon=${lng.toFixed(2)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const tekst = (await res.text()).trim();
  if (!tekst) return null;

  const nu = new Date();
  return tekst
    .split('\n')
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((regel) => parseRegenRegel(regel, nu));
}

// Dichtstbijzijnde meetstation uit het publieke stationsnetwerk — niet elk
// station meet alle grootheden (luchtdruk/zonkracht ontbreken bij een deel
// van de ~40 stations); beschrijfWeerbericht() laat een ontbrekend veld dan
// gewoon weg i.p.v. een foutmelding te tonen.
async function haalDichtstbijzijndStation(lat, lng) {
  const res = await fetch(FEED_URL);
  if (!res.ok) return null;
  const data = await res.json();
  const stations = data?.actual?.stationmeasurements || [];
  if (!stations.length) return null;

  let dichtstbij = null;
  let minAfstand = Infinity;
  for (const s of stations) {
    const afstand = haversineAfstand(lat, lng, s.lat, s.lon);
    if (afstand < minAfstand) { minAfstand = afstand; dichtstbij = s; }
  }
  if (!dichtstbij) return null;
  return { ...dichtstbij, afstandKm: Math.round(minAfstand / 100) / 10 };
}

export async function haalWeerbericht(lat, lng) {
  const [regenreeks, station] = await Promise.all([
    haalRegenreeks(lat, lng).catch(() => null),
    haalDichtstbijzijndStation(lat, lng).catch(() => null)
  ]);
  return { regenreeks, station };
}

function formatTijd(datum) {
  return datum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

// Eén leesbare zin over de neerslag: nu droog/nat + wanneer dat verandert +
// de hevigste bui in het venster.
function beschrijfRegen(regenreeks) {
  if (!regenreeks?.length) return null;

  const horizonMinuten = Math.round((regenreeks[regenreeks.length - 1].tijd - regenreeks[0].tijd) / 60000) + 5;
  const huidig = regenreeks[0];
  const piek = regenreeks.reduce((max, r) => (r.mmPerUur > max.mmPerUur ? r : max), regenreeks[0]);

  if (huidig.mmPerUur > 0) {
    const droogVanaf = regenreeks.find((r) => r.mmPerUur === 0);
    const piekTekst = piek.mmPerUur > huidig.mmPerUur ? `, hevigst rond ${formatTijd(piek.tijd)} (~${piek.mmPerUur} mm/u)` : '';
    return droogVanaf
      ? `🌧️ Nu ~${huidig.mmPerUur} mm/u — naar verwachting droog vanaf ${formatTijd(droogVanaf.tijd)}${piekTekst}.`
      : `🌧️ Nu ~${huidig.mmPerUur} mm/u, de komende ${horizonMinuten} minuten blijft het naar verwachting nat${piekTekst}.`;
  }

  const eersteRegen = regenreeks.find((r) => r.mmPerUur > 0);
  if (!eersteRegen) {
    return `☀️ Droog (0 mm/u) in de komende ${horizonMinuten} minuten.`;
  }
  return `🌧️ Nu droog — neerslag verwacht vanaf ${formatTijd(eersteRegen.tijd)}, hevigst rond ${formatTijd(piek.tijd)} (~${piek.mmPerUur} mm/u).`;
}

// Som van mmPerUur × 5 minuten over de hele reeks = totaal verwachte
// neerslag (mm) in het venster — vervangt de eerdere Open-Meteo-uursom.
function totaalNeerslagMm(regenreeks) {
  if (!regenreeks?.length) return null;
  return Math.round(regenreeks.reduce((s, r) => s + r.mmPerUur * (5 / 60), 0) * 10) / 10;
}

const WINDRICHTING_VAN_GRADEN = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
function windRichtingTekst(station) {
  if (station.winddirection) return station.winddirection;
  if (station.winddirectiondegrees == null) return '';
  return WINDRICHTING_VAN_GRADEN[Math.round(station.winddirectiondegrees / 45) % 8];
}

// { regenTekst, weerItems } — regenTekst is de doorlopende zin over neerslag,
// weerItems zijn losse { icoon, tekst }-rijen (wind/druk/zon/totaal mm) die
// de aanroeper (DashboardKaart.jsx) als uitgelijnde rijen rendert.
export function beschrijfWeerbericht(weer) {
  if (!weer) return { regenTekst: null, weerItems: null };
  const { regenreeks, station } = weer;

  const regenTekst = beschrijfRegen(regenreeks);
  const items = [];

  if (station?.windspeed != null) {
    items.push({ icoon: '💨', tekst: `Wind ${Math.round(station.windspeed * 3.6)} km/u ${windRichtingTekst(station)}` });
  }
  const totaalMm = totaalNeerslagMm(regenreeks);
  if (totaalMm != null) {
    items.push({ icoon: '📊', tekst: `${totaalMm.toFixed(1)} mm verwacht komende 2 uur` });
  }
  if (station?.airpressure != null) items.push({ icoon: '🔽', tekst: `${Math.round(station.airpressure)} hPa` });
  if (station?.sunpower != null) items.push({ icoon: '🌤️', tekst: `Zonkracht nu: ${Math.round(station.sunpower)} W/m²` });
  if (station) items.push({ icoon: '📡', tekst: `${station.stationname} (${station.afstandKm} km)` });

  return { regenTekst, weerItems: items };
}

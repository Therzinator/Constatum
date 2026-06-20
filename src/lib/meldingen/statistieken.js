import { degToCompass } from '../drift/oordeel.js';

// Komt overeen met het statistiekgedeelte van updateDashboard() uit
// docs/index.html (totaal/deze-maand/deze-week/meest-voorkomende windrichting).
export function dashboardStatistieken(meldingen) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const totaal = meldingen.length;
  const dezeMaand = meldingen.filter((m) => {
    const d = new Date(m.timestamp_local);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  const dezeWeek = meldingen.filter((m) => new Date(m.timestamp_local) > weekAgo).length;

  let topWind = '—';
  const windDirs = meldingen
    .filter((m) => m.weather?.wind_dir !== undefined)
    .map((m) => degToCompass(m.weather.wind_dir));
  if (windDirs.length) {
    const freq = {};
    windDirs.forEach((d) => { freq[d] = (freq[d] || 0) + 1; });
    topWind = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }

  return { totaal, dezeMaand, dezeWeek, topWind };
}

// Aantal meldingen per maand, laatste 12 maanden — komt overeen met het
// maand-aggregatiedeel van renderCharts() uit docs/index.html.
export function maandelijkseAantallen(meldingen) {
  const maanden = {};
  meldingen.forEach((m) => {
    const d = new Date(m.timestamp_local);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    maanden[key] = (maanden[key] || 0) + 1;
  });
  const sleutels = Object.keys(maanden).sort().slice(-12);
  const labels = sleutels.map((k) => {
    const [j, m] = k.split('-');
    return new Date(j, m - 1).toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });
  });
  return { labels, aantallen: sleutels.map((k) => maanden[k]) };
}

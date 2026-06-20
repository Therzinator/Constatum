// Komt overeen met fetchWeather() uit docs/index.html — Open-Meteo actuele
// weerdata, gebruikt voor de spuitrichtlijn-beoordeling (zie lib/drift/oordeel.js).
export async function haalWeerdata(lat, lng) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,is_day&wind_speed_unit=kmh&timezone=auto`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.current || data.current.wind_direction_10m === undefined) {
      throw new Error('Onverwacht API-formaat');
    }

    const c = data.current;
    return {
      wind_speed: c.wind_speed_10m,
      wind_dir: c.wind_direction_10m,
      wind_gusts: c.wind_gusts_10m,
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      pressure: c.surface_pressure,
      cloud_cover: c.cloud_cover ?? null,
      is_day: c.is_day === 1,
      source: 'Open-Meteo API',
      timestamp: new Date().toISOString(),
      lat,
      lng
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Komt overeen met het wind-subjectief-voorinvullen in fetchWeather()
export function windSubjectiefVanSnelheid(windKmh, gustsKmh) {
  const kmh = windKmh ?? 0;
  const gusts = gustsKmh ?? 0;
  if (gusts > 28 || kmh > 20) return 'vlagerig';
  if (kmh > 14) return 'sterk';
  if (kmh > 8) return 'matig';
  if (kmh > 2) return 'zwak';
  return 'geen';
}

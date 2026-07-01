import { describe, it, expect } from 'vitest';
import { verifieerEXIFLocatie } from './exif.js';

const MELDING_LAT = 52.0;
const MELDING_LNG = 5.0;
const MELDING_TIJD = new Date('2026-07-01T14:00:00.000Z').toISOString();

// exif.datetime_original is een LOKALE naive string (geen 'Z') die de
// browser interpreteert in de tijdzone van het toestel zelf (zie
// verifieerEXIFLocatie-commentaar in exif.js). Om onafhankelijk te zijn
// van de tijdzone van de machine waarop de test draait, wordt de
// offset t.o.v. MELDING_TIJD via lokale Date-getters naar dezelfde
// "naive"-notatie omgezet — zo is het tijdsverschil altijd exact
// `offsetMin`, ongeacht de tijdzone van de test-runner.
function naiefLokaalOpOffset(offsetMin) {
  const d = new Date(new Date(MELDING_TIJD).getTime() + offsetMin * 60000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

describe('verifieerEXIFLocatie', () => {
  it('geeft null als er geen GPS in de EXIF zit (bv. iOS-share)', () => {
    expect(verifieerEXIFLocatie({ datetime_original: naiefLokaalOpOffset(0) }, MELDING_LAT, MELDING_LNG, MELDING_TIJD)).toBeNull();
    expect(verifieerEXIFLocatie(null, MELDING_LAT, MELDING_LNG, MELDING_TIJD)).toBeNull();
  });

  it('geeft null als de melding zelf geen locatie heeft', () => {
    const exif = { gps_lat: MELDING_LAT, gps_lng: MELDING_LNG };
    expect(verifieerEXIFLocatie(exif, null, null, MELDING_TIJD)).toBeNull();
  });

  it('overeenkomst=true bij nagenoeg dezelfde locatie en tijd', () => {
    const exif = { gps_lat: 52.0005, gps_lng: 5.0005, datetime_original: naiefLokaalOpOffset(5) };
    const result = verifieerEXIFLocatie(exif, MELDING_LAT, MELDING_LNG, MELDING_TIJD);
    expect(result.overeenkomst).toBe(true);
    expect(result.afstand_m).toBeLessThan(500);
    expect(result.tijdsverschil_min).toBe(5);
  });

  it('overeenkomst=false als de foto te ver weg is genomen (> 500m)', () => {
    const exif = { gps_lat: 52.02, gps_lng: 5.02, datetime_original: naiefLokaalOpOffset(0) };
    const result = verifieerEXIFLocatie(exif, MELDING_LAT, MELDING_LNG, MELDING_TIJD);
    expect(result.overeenkomst).toBe(false);
    expect(result.afstand_m).toBeGreaterThan(500);
  });

  it('overeenkomst=false als het tijdsverschil te groot is (> 30 min)', () => {
    const exif = { gps_lat: MELDING_LAT, gps_lng: MELDING_LNG, datetime_original: naiefLokaalOpOffset(-120) };
    const result = verifieerEXIFLocatie(exif, MELDING_LAT, MELDING_LNG, MELDING_TIJD);
    expect(result.overeenkomst).toBe(false);
    expect(result.tijdsverschil_min).toBe(120);
  });

  it('negeert het tijdscriterium als de EXIF geen datetime_original heeft', () => {
    const exif = { gps_lat: MELDING_LAT, gps_lng: MELDING_LNG };
    const result = verifieerEXIFLocatie(exif, MELDING_LAT, MELDING_LNG, MELDING_TIJD);
    expect(result.overeenkomst).toBe(true);
    expect(result.tijdsverschil_min).toBeNull();
  });
});

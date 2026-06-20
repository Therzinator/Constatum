// Pasquill-Gifford atmosferische stabiliteitsklasse (A–F), bepaald uit
// windsnelheid + insolatie (overdag) of bewolking (nacht) — standaard
// Turner (1964) tabel. Relevant voor drift-beoordeling: instabiele
// klassen (A–C) geven sterkere verticale luchtmenging, stabiele klassen
// (E–F) houden spuitnevel lager bij de grond en laten 'm verder afdrijven.
const KLASSE_LABEL = {
  A: 'Zeer instabiel', B: 'Instabiel', C: 'Licht instabiel',
  D: 'Neutraal', E: 'Licht stabiel', F: 'Stabiel'
};

// Insolatie-categorie uit bewolkingsgraad (%) bij daglicht — grove benadering
// van de "strong/moderate/slight" indeling uit de Turner-tabel.
function insolatieCategorie(cloudCoverPct) {
  if (cloudCoverPct == null) return 'matig';
  if (cloudCoverPct < 30) return 'sterk';
  if (cloudCoverPct < 70) return 'matig';
  return 'licht';
}

export function berekenPasquillKlasse(windSpeedKmh, cloudCoverPct, isDay) {
  if (windSpeedKmh == null) return null;
  const ms = windSpeedKmh / 3.6;
  let klasse;

  if (isDay) {
    const insolatie = insolatieCategorie(cloudCoverPct);
    if (ms < 2) klasse = insolatie === 'licht' ? 'B' : 'A';
    else if (ms < 3) klasse = insolatie === 'sterk' ? 'A' : insolatie === 'matig' ? 'B' : 'C';
    else if (ms < 5) klasse = insolatie === 'sterk' ? 'B' : insolatie === 'matig' ? 'B' : 'C';
    else if (ms < 6) klasse = insolatie === 'sterk' ? 'C' : insolatie === 'matig' ? 'C' : 'D';
    else klasse = insolatie === 'sterk' ? 'C' : 'D';
  } else {
    const helder = cloudCoverPct == null || cloudCoverPct <= 37.5; // ≤3/8 bewolking
    if (ms < 2) klasse = helder ? 'F' : 'F';
    else if (ms < 3) klasse = helder ? 'F' : 'E';
    else if (ms < 5) klasse = helder ? 'E' : 'D';
    else klasse = 'D';
  }

  return { klasse, label: KLASSE_LABEL[klasse] };
}

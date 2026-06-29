function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formateerDatum(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
}

function addDagen(dateStr, dagen) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  d.setDate(d.getDate() + dagen);
  return d.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
}

// Retourneert de brief als platte tekst — voor readonly voorvertoning in de UI.
export function briefTekstVoorVertoning(melding, naamMelder, adresMelder) {
  const nu = new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
  const meldingDatumVol = formateerDatum(melding.timestamp_local || melding.date);
  const periodeVan = addDagen(melding.timestamp_local || melding.date, -30);
  const periodeTot = addDagen(melding.timestamp_local || melding.date, 7);
  const lat = melding.gps?.lat?.toFixed(6) ?? '—';
  const lng = melding.gps?.lng?.toFixed(6) ?? '—';
  const weerBron = melding.weather?.source || 'Open-Meteo/KNMI';
  const tijdstempel = melding.rfc3161?.timestamp
    ? `✓ RFC 3161 tijdstempel: ${new Date(melding.rfc3161.timestamp).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}`
    : `Melding opgeslagen op: ${new Date(melding.timestamp_local).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}\n   (geen RFC 3161 tijdstempel beschikbaar — melding mogelijk offline aangemaakt)`;

  return `${naamMelder}
${adresMelder}

${nu}

Aan:
Ministerie van Landbouw, Natuur en Voedselkwaliteit (LVVN)
Postbus 20401
2500 EK Den Haag

Betreft: Verzoek tot inzage spuitregistraties op grond van
Verordening (EG) nr. 1107/2009 artikel 67

Geachte heer/mevrouw,

Op grond van artikel 67 van Verordening (EG) nr. 1107/2009 van het
Europees Parlement en de Raad betreffende het op de markt brengen
van gewasbeschermingsmiddelen verzoek ik u hierbij om inzage in de
spuitregistraties van het navolgende perceel.

PERCEEL
Perceelnummer (BRP/RVO): ${melding.perceelnummer}
Locatie (gemeente): ${melding.gemeente || '—'}
GPS-coördinaten: ${lat}°N · ${lng}°E

PERIODE
Waargenomen spuitactiviteit op: ${meldingDatumVol}
Verzochte registratieperiode: ${periodeVan} t/m ${periodeTot}

GRONDSLAG
De rechtbank Noord-Nederland heeft op 12 januari 2026 (zaaknummers
LEE 23/5100 en LEE 23/1511, ECLI:NL:RBNNE:2026:130 en
ECLI:NL:RBNNE:2026:129) geoordeeld dat omwonenden op grond van
artikel 67 van Verordening (EG) nr. 1107/2009 recht hebben op inzage
in spuitregistraties van nabijgelegen agrarische percelen. Ik beroep
mij op dit recht als omwonende die op voornoemde datum spuitactiviteit
heeft waargenomen in de directe nabijheid van mijn woning.

ONDERBOUWING
Ter onderbouwing van mijn verzoek voeg ik bij:
- Een dossier-PDF gegenereerd door SpuitLogger, voorzien van RFC 3161
  tijdstempel (onweerlegbaar tijdstip) en SHA-256 integriteitsborging
- Meteorologische data van ${weerBron}
  op het moment van de waarneming

Ik verzoek u mij binnen de wettelijke termijn van 4 weken te berichten
over de beschikbare spuitregistraties voor het bovengenoemde perceel
en de periode.

Hoogachtend,

${naamMelder}
${adresMelder}

---
Noot: Het Ministerie van LVVN heeft hoger beroep ingesteld bij de
Afdeling bestuursrechtspraak van de Raad van State. Het hoger beroep
heeft geen automatische schorsende werking. Volg de voortgang via
metenweten.nl.

---
Gegenereerd door SpuitLogger — spuitlogger.nl
Melding-ID: ${melding.id}
${tijdstempel}`;
}

// Genereert de brief als opmaakvaste HTML (A4, wit, formele brief) — voor print/opslaan als PDF.
export function genereerSpuitregisterBrief(melding, naamMelder, adresMelder) {
  const nu = new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
  const meldingDatumVol = formateerDatum(melding.timestamp_local || melding.date);
  const periodeVan = addDagen(melding.timestamp_local || melding.date, -30);
  const periodeTot = addDagen(melding.timestamp_local || melding.date, 7);
  const lat = melding.gps?.lat?.toFixed(6) ?? '—';
  const lng = melding.gps?.lng?.toFixed(6) ?? '—';
  const weerBron = melding.weather?.source || 'Open-Meteo/KNMI';
  const heeftRfc3161 = !!melding.rfc3161?.timestamp;
  const rfc3161Tekst = heeftRfc3161
    ? `✓ RFC 3161: ${new Date(melding.rfc3161.timestamp).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}`
    : `Opgeslagen op: ${new Date(melding.timestamp_local).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })} (geen RFC 3161)`;
  const adresHTML = escapeHTML(adresMelder).replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spuitregister opvraagbrief — SpuitLogger</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.55; background: #fff; color: #111; }
  .pagina { max-width: 210mm; margin: 0 auto; padding: 20mm 22mm 30mm; min-height: 297mm; position: relative; }
  .koptekst { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28pt; }
  .logo-blok { text-align: right; font-size: 9pt; color: #555; line-height: 1.4; }
  .logo-naam { font-weight: bold; font-size: 10.5pt; color: #000; }
  .datum-rij { text-align: right; margin-bottom: 22pt; font-size: 10.5pt; }
  .geadresseerde { margin-bottom: 22pt; line-height: 1.6; }
  .betreft-blok { margin-bottom: 18pt; padding-bottom: 6pt; border-bottom: 1px solid #bbb; font-weight: bold; font-size: 10.5pt; }
  h3 { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #ddd; padding-bottom: 3pt; margin: 16pt 0 6pt; color: #333; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 14pt; font-size: 10pt; }
  td { padding: 3pt 6pt 3pt 0; vertical-align: top; }
  td:first-child { white-space: nowrap; font-weight: 600; width: 42%; color: #444; }
  p { margin-bottom: 10pt; font-size: 10.5pt; }
  ul { margin: 0 0 10pt 18pt; font-size: 10.5pt; }
  li { margin-bottom: 4pt; }
  .aanhef { margin-bottom: 12pt; }
  .intro { margin-bottom: 4pt; }
  .afsluiting { margin-top: 18pt; }
  .handtekening { margin-top: 40pt; line-height: 1.6; }
  .voetnoot { position: fixed; bottom: 8mm; left: 22mm; right: 22mm; border-top: 1px solid #ccc; padding-top: 4pt; font-size: 7pt; color: #888; font-family: monospace; display: flex; justify-content: space-between; gap: 8pt; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .pagina { padding: 20mm 22mm 30mm; }
  }
</style>
</head>
<body>
<div class="pagina">
  <div class="koptekst">
    <div>
      <strong>${escapeHTML(naamMelder)}</strong><br>
      ${adresHTML}
    </div>
    <div class="logo-blok">
      <div class="logo-naam">SpuitLogger</div>
      spuitlogger.nl
    </div>
  </div>

  <div class="datum-rij">${escapeHTML(nu)}</div>

  <div class="geadresseerde">
    Aan:<br>
    <strong>Ministerie van Landbouw, Natuur en Voedselkwaliteit (LVVN)</strong><br>
    Postbus 20401<br>
    2500 EK Den Haag
  </div>

  <div class="betreft-blok">
    Betreft: Verzoek tot inzage spuitregistraties op grond van
    Verordening (EG) nr. 1107/2009 artikel 67
  </div>

  <p class="aanhef">Geachte heer/mevrouw,</p>

  <p class="intro">Op grond van artikel 67 van Verordening (EG) nr. 1107/2009 van het Europees Parlement en de Raad betreffende het op de markt brengen van gewasbeschermingsmiddelen verzoek ik u hierbij om inzage in de spuitregistraties van het navolgende perceel.</p>

  <h3>Perceel</h3>
  <table>
    <tr><td>Perceelnummer (BRP/RVO)</td><td>${escapeHTML(melding.perceelnummer)}</td></tr>
    ${melding.gemeente ? `<tr><td>Locatie (gemeente)</td><td>${escapeHTML(melding.gemeente)}</td></tr>` : ''}
    <tr><td>GPS-coördinaten</td><td>${escapeHTML(lat)}°N &middot; ${escapeHTML(lng)}°E</td></tr>
  </table>

  <h3>Periode</h3>
  <table>
    <tr><td>Waargenomen spuitactiviteit op</td><td>${escapeHTML(meldingDatumVol)}</td></tr>
    <tr><td>Verzochte registratieperiode</td><td>${escapeHTML(periodeVan)} t/m ${escapeHTML(periodeTot)}</td></tr>
  </table>

  <h3>Grondslag</h3>
  <p>De rechtbank Noord-Nederland heeft op 12 januari 2026 (zaaknummers LEE 23/5100 en LEE 23/1511, ECLI:NL:RBNNE:2026:130 en ECLI:NL:RBNNE:2026:129) geoordeeld dat omwonenden op grond van artikel 67 van Verordening (EG) nr. 1107/2009 recht hebben op inzage in spuitregistraties van nabijgelegen agrarische percelen. Ik beroep mij op dit recht als omwonende die op voornoemde datum spuitactiviteit heeft waargenomen in de directe nabijheid van mijn woning.</p>

  <h3>Onderbouwing</h3>
  <p>Ter onderbouwing van mijn verzoek voeg ik bij:</p>
  <ul>
    <li>Een dossier-PDF gegenereerd door SpuitLogger, voorzien van RFC&nbsp;3161 tijdstempel (onweerlegbaar tijdstip) en SHA-256 integriteitsborging</li>
    <li>Meteorologische data van ${escapeHTML(weerBron)} op het moment van de waarneming</li>
  </ul>

  <p>Ik verzoek u mij binnen de wettelijke termijn van 4 weken te berichten over de beschikbare spuitregistraties voor het bovengenoemde perceel en de periode.</p>

  <div class="afsluiting">
    <p>Hoogachtend,</p>
    <div class="handtekening">
      ${escapeHTML(naamMelder)}<br>
      ${adresHTML}
    </div>
  </div>

  <div style="margin-top: 28pt; padding-top: 8pt; border-top: 1px solid #ddd; font-size: 8pt; color: #555; line-height: 1.5;">
    <strong>Noot hoger beroep:</strong> Het Ministerie van Landbouw, Visserij, Voedselzekerheid en Natuur (LVVN) heeft hoger beroep ingesteld bij de Afdeling bestuursrechtspraak van de Raad van State tegen de uitspraken van 12 januari 2026. Het hoger beroep heeft geen automatische schorsende werking &mdash; uw verzoek kan gewoon worden ingediend. Het ministerie heeft echter laten weten ingekomen verzoeken aan te houden totdat er juridische duidelijkheid bestaat. Dit verzoek wordt ingediend op grond van de huidige rechtspositie zoals vastgesteld door de Rechtbank Noord-Nederland. Volg de voortgang via metenweten.nl.
  </div>

  <div class="voetnoot">
    <span>Gegenereerd door SpuitLogger &mdash; spuitlogger.nl &nbsp;&middot;&nbsp; Melding-ID: ${escapeHTML(melding.id)}</span>
    <span>${escapeHTML(rfc3161Tekst)}</span>
  </div>
</div>
</body>
</html>`;
}

// Opent de gegenereerde HTML als blob-URL in een nieuw tabblad — zelfde patroon als openDossierPDF().
export function openSpuitregisterBrief(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error('Pop-up geblokkeerd — sta pop-ups toe voor deze site en probeer opnieuw');
  }
}

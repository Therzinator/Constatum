import { useState } from 'react';
import { laadKNMIKey, slaKNMIKeyOp } from '../../lib/weather/knmi.js';

// Komt overeen met het KNMI-instellingenblok uit docs/index.html
// (slaKNMIKeyOp/laadKNMIKey) — hier als losse, herbruikbare card i.p.v.
// de niet-bestaande Instellingen-pagina (zie comment in ExportPage.jsx).
export function KNMIInstellingen() {
  const [key, setKey] = useState(() => laadKNMIKey());
  const [status, setStatus] = useState(null);

  const opslaan = () => {
    const schoon = key.trim();
    if (!schoon) {
      setStatus({ tekst: '⚠️ Voer een API-key in', kleur: 'var(--warning)' });
      return;
    }
    slaKNMIKeyOp(schoon);
    setStatus({ tekst: '✓ Key opgeslagen', kleur: 'var(--accent)' });
    setTimeout(() => setStatus(null), 2000);
  };

  return (
    <div className="card p-4">
      <div className="section-label mb-2">🌦️ KNMI Weerdata</div>
      <div className="export-card-beschrijving mb-3">
        Officiële KNMI-stationsdata versterkt het juridische dossier. Gratis API-key aanvragen via{' '}
        <a href="https://dataplatform.knmi.nl" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
          dataplatform.knmi.nl
        </a>.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          className="form-input px-3 py-2"
          style={{ flex: 1 }}
          placeholder="KNMI API key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button type="button" className="btn-primary px-3 py-2" onClick={opslaan}>Opslaan</button>
      </div>
      {status && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: status.kleur, marginTop: 6 }}>
          {status.tekst}
        </div>
      )}
      <div className="export-card-beschrijving mt-2">
        Wordt gebruikt bij meldingdetails en export voor gecertificeerde weerdata (CC BY 4.0 © KNMI).
      </div>
    </div>
  );
}

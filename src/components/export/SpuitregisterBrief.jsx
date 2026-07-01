import { useState } from 'react';
import { briefTekstVoorVertoning, genereerSpuitregisterBrief, openSpuitregisterBrief } from '../../lib/export/spuitregisterBrief.js';

export function SpuitregisterBrief({ meldingen }) {
  const [geselecteerdId, setGeselecteerdId] = useState('');
  const [naam, setNaam] = useState('');
  const [adres, setAdres] = useState('');
  const [fout, setFout] = useState(null);

  const metPerceel = meldingen.filter((m) => m.perceelnummer);
  const melding = metPerceel.find((m) => m.id === geselecteerdId) || null;
  const kanDownloaden = !!(melding && naam.trim() && adres.trim());

  const handleDownload = () => {
    if (!kanDownloaden) return;
    setFout(null);
    try {
      const html = genereerSpuitregisterBrief(melding, naam.trim(), adres.trim());
      openSpuitregisterBrief(html);
    } catch (err) {
      setFout(err.message);
    }
  };

  const geenRfc3161 = melding && !melding.rfc3161?.timestamp;

  if (metPerceel.length === 0) {
    return (
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', padding: '4px 0' }}>
        Voeg een perceelnummer toe aan een melding om een brief te genereren.
      </p>
    );
  }

  const meldingLabel = (m) => {
    const datum = m.date || m.timestamp_local?.split('T')[0] || '—';
    return `${datum} · ${m.perceelnummer} · ${m.gemeente || 'onbekende gemeente'}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label className="export-card-beschrijving" htmlFor="sb-melding-select" style={{ display: 'block', marginBottom: '6px' }}>
          Selecteer een melding als basis
        </label>
        <select
          id="sb-melding-select"
          className="export-knop"
          style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
          value={geselecteerdId}
          onChange={(e) => setGeselecteerdId(e.target.value)}
        >
          <option value="">— kies een melding —</option>
          {metPerceel.map((m) => (
            <option key={m.id} value={m.id}>{meldingLabel(m)}</option>
          ))}
        </select>
      </div>

      {melding && (
        <>
          <div>
            <label className="export-card-beschrijving" htmlFor="sb-naam" style={{ display: 'block', marginBottom: '4px' }}>
              Uw volledige naam <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
            </label>
            <input
              id="sb-naam"
              type="text"
              placeholder="Voor- en achternaam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 'var(--font-size-base)' }}
            />
          </div>

          <div>
            <label className="export-card-beschrijving" htmlFor="sb-adres" style={{ display: 'block', marginBottom: '4px' }}>
              Adres, postcode en plaats <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
            </label>
            <textarea
              id="sb-adres"
              placeholder={'Straatnaam 1\n1234 AB Plaatsnaam'}
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 'var(--font-size-base)', resize: 'vertical' }}
            />
          </div>

          {geenRfc3161 && (
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', padding: '10px 12px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              ⚠️ Deze melding heeft geen RFC 3161 tijdstempel. De brief is geldig maar heeft minder bewijskracht. Maak een nieuwe melding aan als u een tijdgestempeld bewijs wilt toevoegen.
            </div>
          )}

          <div>
            <div className="export-card-beschrijving" style={{ marginBottom: '6px' }}>Voorvertoning brief</div>
            <textarea
              readOnly
              value={naam.trim() && adres.trim()
                ? briefTekstVoorVertoning(melding, naam.trim(), adres.trim())
                : '(Vul naam en adres in om de voorvertoning te tonen)'}
              rows={18}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                color: naam.trim() && adres.trim() ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--mono)',
                resize: 'vertical',
              }}
            />
          </div>
        </>
      )}

      <button
        type="button"
        className="btn-outline export-knop"
        disabled={!kanDownloaden}
        onClick={handleDownload}
        style={{ width: '100%' }}
      >
        📄 Download brief als PDF
      </button>

      {fout && (
        <p style={{ color: 'var(--danger, #ef4444)', fontSize: 'var(--font-size-sm)' }}>{fout}</p>
      )}

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        ℹ️ Stuur deze brief per aangetekende post of e-mail naar het Ministerie van LVVN of de NVWA.
        Voeg een kopie van uw dossier-PDF toe als onderbouwing.
      </div>
    </div>
  );
}

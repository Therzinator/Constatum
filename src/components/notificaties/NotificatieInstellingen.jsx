import { RADIUS_OPTIES } from '../../lib/notificaties/buurtMelding.js';

// Instellingen voor Fase F (notificaties bij nieuwe meldingen in de buurt).
// Staat — net als opslagbeheer — voorlopig in ExportPage tot er een eigen
// Instellingen-pagina is (zie comment in ExportPage.jsx).
export function NotificatieInstellingen({ notificatieApi }) {
  const { instellingen, permissie, zetAan, zetRadius, vraagPermissie } = notificatieApi;

  const handleAanUit = async (e) => {
    const aan = e.target.checked;
    if (aan && permissie === 'default') await vraagPermissie();
    zetAan(aan);
  };

  return (
    <div className="card p-4">
      <div className="section-label mb-3">🔔 Notificaties in de buurt</div>
      <div className="export-card-beschrijving mb-3">
        Ontvang een melding als er een nieuwe melding van een ander wordt
        toegevoegd binnen het ingestelde bereik van de thuislocatie.
      </div>

      <label className="export-info-rij" style={{ cursor: 'pointer' }}>
        <span>Notificaties aan</span>
        <input type="checkbox" checked={instellingen.aan} onChange={handleAanUit} />
      </label>

      <label className="export-info-rij" style={{ cursor: 'pointer' }}>
        <span>Bereik</span>
        <select
          value={instellingen.radiusMeter}
          onChange={(e) => zetRadius(parseInt(e.target.value, 10))}
        >
          {RADIUS_OPTIES.map((m) => (
            <option key={m} value={m}>{m >= 1000 ? `${m / 1000} km` : `${m} m`}</option>
          ))}
        </select>
      </label>

      {instellingen.aan && permissie === 'denied' && (
        <div className="export-card-beschrijving mt-2" style={{ color: 'var(--danger)' }}>
          Browser-notificaties zijn geblokkeerd — meldingen verschijnen alleen als banner in de app.
        </div>
      )}
    </div>
  );
}

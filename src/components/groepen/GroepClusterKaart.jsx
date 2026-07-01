import { useState } from 'react';
import { clusterDuur } from '../../lib/meldingen/clustering.js';
import { GroepMeldingKaart } from './GroepMeldingKaart.jsx';
import '../meldingen/ClusterCard.css';

const TYPE_LABEL = {
  spuitactiviteit: '🚜 Spuitactiviteit',
  drift: '💨 Drift/nevel',
  geur: '🌬️ Chemische geur',
  geluid: '🔊 Geluid',
  gezondheid: '🏥 Gezondheid',
  overig: '📝 Overig'
};

function dominantType(meldingen) {
  const types = meldingen.map((m) => m.type);
  return types.sort((a, b) => types.filter((t) => t === b).length - types.filter((t) => t === a).length)[0];
}

// Groeps-variant van ClusterCard.jsx (persoonlijke Tijdlijn) — toont een
// gebeurtenis (meerdere meldingen op hetzelfde perceel/dezelfde locatie
// binnen 8u, zie lib/meldingen/clustering.js) als kaart met mini-tijdlijn.
// Rendert per melding GroepMeldingKaart i.p.v. MeldingCard, zodat de
// trust-tier-gate (`toon`) ook binnen een cluster gerespecteerd blijft —
// nooit de zwaardere persoonlijke MeldingCard/MeldingDetailModal (hash/
// RFC3161/device) voor gedeelde groepsmeldingen.
export function GroepClusterKaart({ cluster, toon, viewerUserId, isBeheerder, verwijderenId, onVerwijder, onOpen }) {
  const [open, setOpen] = useState(false);

  if (cluster.meldingen.length === 1) {
    return (
      <GroepMeldingKaart
        melding={cluster.meldingen[0]}
        toon={toon}
        viewerUserId={viewerUserId}
        isBeheerder={isBeheerder}
        verwijderenId={verwijderenId}
        onVerwijder={onVerwijder}
        onOpen={onOpen}
      />
    );
  }

  const duur = clusterDuur(cluster);
  const datum = new Date(cluster.beginTijd);
  const datumStr = datum.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  const tijdStr = datum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const windValues = toon.metadata
    ? cluster.meldingen.map((m) => m.weather?.wind_speed).filter((w) => w != null)
    : [];
  const windRange = windValues.length
    ? `${Math.min(...windValues).toFixed(0)}–${Math.max(...windValues).toFixed(0)} km/h`
    : null;

  return (
    <div className="card cluster-card">
      <div className="cluster-card-top">
        <div>
          <div className="cluster-card-titel">{TYPE_LABEL[dominantType(cluster.meldingen)] || dominantType(cluster.meldingen)}</div>
          <div className="cluster-card-tijd">{datumStr} {tijdStr}{duur ? ` — +${duur}` : ''}</div>
        </div>
        <div className="cluster-card-badges">
          <span className="cluster-card-badge">{cluster.meldingen.length} meldingen</span>
          {cluster.aantalMelders > 1 && (
            <span className="cluster-card-badge cluster-card-badge-melders">👥 {cluster.aantalMelders} melders</span>
          )}
        </div>
      </div>

      <div className="cluster-card-meta">
        {duur && <span className="cluster-card-meta-duur">⏱ {duur}</span>}
        {toon.exacteLocatie && cluster.perceelnummer && <span className="cluster-card-meta-perceel">📋 {cluster.perceelnummer}</span>}
        {windRange && <span className="cluster-card-meta-wind">💨 {windRange}</span>}
      </div>

      <div className="cluster-card-tijdlijn">
        <div className="cluster-card-tijdlijn-label">TIJDLIJN</div>
        <div className="cluster-card-tijdlijn-rij">
          {cluster.meldingen.map((m, idx) => {
            const t = new Date(m.timestamp_local);
            const tStr = t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            const ws = toon.metadata ? m.weather?.wind_speed : null;
            const kleur = ws > 18 ? 'var(--danger)' : ws > 10 ? 'var(--warning)' : 'var(--accent)';
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="cluster-card-tijdlijn-item">
                  <div className="cluster-card-tijdlijn-dot" style={{ background: kleur }} />
                  <div className="cluster-card-tijdlijn-tijd">{tStr}</div>
                  {ws != null && <div className="cluster-card-tijdlijn-wind" style={{ color: kleur }}>{ws.toFixed(0)}km/h</div>}
                </div>
                {idx < cluster.meldingen.length - 1 && <div className="cluster-card-tijdlijn-lijn" />}
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" className="cluster-card-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▲ Verberg meldingen' : `▼ Toon alle ${cluster.meldingen.length} meldingen`}
      </button>

      {open && (
        <div className="cluster-card-detail">
          {cluster.meldingen.map((m) => (
            <GroepMeldingKaart
              key={m.id}
              melding={m}
              toon={toon}
              viewerUserId={viewerUserId}
              isBeheerder={isBeheerder}
              verwijderenId={verwijderenId}
              onVerwijder={onVerwijder}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

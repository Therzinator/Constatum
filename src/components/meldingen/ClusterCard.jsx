import { useState } from 'react';
import { clusterDuur } from '../../lib/meldingen/clustering.js';
import { MeldingCard } from './MeldingCard.jsx';
import './ClusterCard.css';

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

// Komt overeen met renderClusterKaart() uit docs/index.html — toont een
// spuitgebeurtenis (groep meldingen, zie lib/meldingen/clustering.js) als
// kaart met mini-tijdlijn en uitklapbare deelmeldingen.
export function ClusterCard({ cluster, user, gebruikerRol, onVerwijderen, onSelecteren }) {
  const [open, setOpen] = useState(false);

  if (cluster.meldingen.length === 1) {
    return (
      <MeldingCard
        melding={cluster.meldingen[0]}
        user={user}
        gebruikerRol={gebruikerRol}
        onVerwijderen={onVerwijderen}
        onSelecteren={onSelecteren}
      />
    );
  }

  const duur = clusterDuur(cluster);
  const datum = new Date(cluster.beginTijd);
  const datumStr = datum.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  const tijdStr = datum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const klachten = [...new Set(cluster.meldingen.flatMap((m) => m.gezondheidsklachten || []))];
  const windValues = cluster.meldingen.map((m) => m.weather?.wind_speed).filter((w) => w != null);
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
        {cluster.perceelnummer && <span className="cluster-card-meta-perceel">📋 {cluster.perceelnummer}</span>}
        {windRange && <span className="cluster-card-meta-wind">💨 {windRange}</span>}
        {klachten.length > 0 && (
          <span className="cluster-card-meta-klachten">
            🏥 {klachten.slice(0, 2).join(', ')}{klachten.length > 2 ? ` +${klachten.length - 2}` : ''}
          </span>
        )}
      </div>

      <div className="cluster-card-tijdlijn">
        <div className="cluster-card-tijdlijn-label">SPUITBEURT TIJDLIJN</div>
        <div className="cluster-card-tijdlijn-rij">
          {cluster.meldingen.map((m, idx) => {
            const t = new Date(m.timestamp_local);
            const tStr = t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            const ws = m.weather?.wind_speed;
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
            <MeldingCard
              key={m.id}
              melding={m}
              user={user}
              gebruikerRol={gebruikerRol}
              onVerwijderen={onVerwijderen}
              onSelecteren={onSelecteren}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { melderCode } from '../../utils/format.js';

const TYPE_LABEL = {
  spuitactiviteit: '🚜 Spuitactiviteit',
  drift: '💨 Drift/nevel',
  geur: '🌬️ Chemische geur',
  geluid: '🔊 Geluid',
  gezondheid: '🏥 Gezondheid',
  overig: '📝 Overig'
};

// Zelfde badge-kleuren per type als MeldingCard.jsx (bewust gedupliceerd,
// zelfde patroon als TYPE_KLEUR tussen MeldingCard.jsx/BuurtgebiedTekenaar.jsx
// — geen gedeelde module, zie CURRENT_STATE.md).
const TYPE_BADGE = {
  spuitactiviteit: 'badge-warning',
  drift: 'badge-info',
  geur: 'badge-muted',
  gezondheid: 'badge-danger',
  geluid: 'badge-muted',
  overig: 'badge-muted'
};

// Eén melding binnen een groep — geëxtraheerd uit GroepMeldingenLijst.jsx
// zodat zowel de platte "Recente meldingen"-lijst als de geclusterde
// "Tijdlijn" (GroepClusterKaart.jsx) exact dezelfde trust-tier-gated
// weergave gebruiken (`toon`, zie lib/groepen/trustZichtbaarheid.js) — geen
// tweede, licht-afwijkende kopie van deze gate-logica.
export function GroepMeldingKaart({ melding, toon, viewerUserId, isBeheerder, verwijderenId, onVerwijder, onOpen }) {
  const datum = new Date(melding.timestamp_local).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
  const isEigen = melding.user_id && melding.user_id === viewerUserId;
  const regio = toon.grofweLocatie ? [melding.gemeente, melding.provincie].filter(Boolean).join(', ') : null;

  return (
    <div
      className="card melding-card melding-card-klikbaar"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(melding)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(melding); }}
    >
      <div className="melding-card-body">
        <div className="melding-card-top">
          <div className="melding-card-badges">
            <span className={`badge ${TYPE_BADGE[melding.type] || 'badge-muted'}`}>{TYPE_LABEL[melding.type] || melding.type}</span>
          </div>
          <span className="melding-card-date">{datum}</span>
        </div>

        {regio && (
          <div className="melding-card-compact-rij2">
            <span className="melding-card-desc">{regio}</span>
          </div>
        )}

        {toon.metadata && melding.description && (
          <div className="melding-card-desc mt-1">{melding.description}</div>
        )}

        {toon.exacteLocatie && melding.gps_lat != null && melding.gps_lng != null && (
          <div className="hash-display mt-1">{melding.gps_lat.toFixed(5)}, {melding.gps_lng.toFixed(5)}</div>
        )}

        {toon.melderInfo && !isEigen && melding.melder_email && (
          <div className="melding-card-meta mt-1">
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>{melderCode(melding.melder_email)}</span>
          </div>
        )}
      </div>
      {isBeheerder && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 6 }}>
          <button
            type="button"
            className="btn-outline"
            style={{ fontSize: 'var(--font-size-sm)', padding: '2px 10px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={verwijderenId === melding.id}
            onClick={(e) => { e.stopPropagation(); onVerwijder(melding.id); }}
          >
            {verwijderenId === melding.id ? 'Verwijderen...' : '✕ Verwijderen'}
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { MeldingCard } from './MeldingCard.jsx';
import { MeldingDetailModal } from '../melding/MeldingDetailModal.jsx';
import './MeldingenLijst.css';

// Komt overeen met het niet-clustered pad van renderTimeline() uit
// docs/index.html (de clusterweergave hoort bij een latere fase).
// `meldingenApi` is het object dat hooks/useMeldingen.js teruggeeft,
// `user`/`gebruikerRol` komen uit hooks/useAuth.js.
export function MeldingenLijst({ meldingenApi, user, gebruikerRol }) {
  const { meldingen, verwijderMeldingLokaal } = meldingenApi;
  const [geselecteerdId, setGeselecteerdId] = useState(null);

  const handleVerwijderen = (id) => {
    if (!confirm('Registratie verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    verwijderMeldingLokaal(id);
  };

  if (meldingen.length === 0) {
    return <div className="meldingen-leeg">Nog geen meldingen geregistreerd.</div>;
  }

  const gesorteerd = [...meldingen].sort(
    (a, b) => new Date(b.timestamp_local) - new Date(a.timestamp_local)
  );
  const geselecteerd = geselecteerdId ? meldingen.find((m) => m.id === geselecteerdId) : null;

  return (
    <div>
      <div className="meldingen-count">{meldingen.length} meldingen</div>
      {gesorteerd.map((m) => (
        <MeldingCard
          key={m.id}
          melding={m}
          user={user}
          gebruikerRol={gebruikerRol}
          onVerwijderen={handleVerwijderen}
          onSelecteren={setGeselecteerdId}
        />
      ))}

      {geselecteerd && (
        <MeldingDetailModal melding={geselecteerd} onClose={() => setGeselecteerdId(null)} />
      )}
    </div>
  );
}

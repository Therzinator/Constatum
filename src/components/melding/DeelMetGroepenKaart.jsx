import { useEffect, useState } from 'react';
import {
  haalMijnGroepen,
  haalGedeeldeGroepenVoorMelding,
  deelMeldingMetGroep,
  verwijderMeldingUitGroep
} from '../../lib/groepen/groepen.js';

// Achteraf een eigen melding delen met groepen waar "Deel mijn meldingen
// met deze groep" aanstaat (groep_leden.deel_meldingen, in te stellen op
// de groepspagina) — los van de checkbox bij het melden zelf, die alleen
// op dat moment gold (migratie 0016). Alleen zinvol voor een melding die
// al in Supabase staat (entries_groepen.entry_id verwijst naar een echte
// entries-rij) en die daadwerkelijk van de kijker zelf is — een
// buurt-gedeelde melding van iemand anders kan via dezelfde
// MeldingDetailModal geopend worden, maar mag hier nooit "gedeeld"
// kunnen worden.
export function DeelMetGroepenKaart({ melding, user }) {
  const [groepen, setGroepen] = useState(null);
  const [gedeeldMet, setGedeeldMet] = useState(new Set());
  const [bezig, setBezig] = useState(new Set());
  const [fout, setFout] = useState(null);

  const isEigen = !melding.user_id || melding.user_id === user?.id;
  const isGesynchroniseerd = melding.sync_status === 'synced' || Boolean(melding.supabase_id);

  useEffect(() => {
    if (!user || !isEigen || !isGesynchroniseerd) return;
    let actief = true;
    Promise.all([haalMijnGroepen(user.id), haalGedeeldeGroepenVoorMelding(melding.id)])
      .then(([mijnGroepen, gedeeld]) => {
        if (!actief) return;
        setGroepen(mijnGroepen.filter((g) => g.deelMeldingen));
        setGedeeldMet(new Set(gedeeld));
      })
      .catch((err) => { if (actief) setFout(err.message); });
    return () => { actief = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [melding.id, user?.id, isEigen, isGesynchroniseerd]);

  if (!user || !isEigen || !isGesynchroniseerd) return null;
  if (groepen == null && !fout) return null; // stilletjes laden, geen lege kaart tonen tijdens het wachten
  if (fout) return null; // niet-kritiek — geen kaart tonen i.p.v. een foutmelding voor een optionele actie

  const handleToggle = async (groepId, actiefDelen) => {
    setBezig((prev) => new Set(prev).add(groepId));
    try {
      if (actiefDelen) {
        await verwijderMeldingUitGroep(groepId, melding.id);
        setGedeeldMet((prev) => { const next = new Set(prev); next.delete(groepId); return next; });
      } else {
        await deelMeldingMetGroep(melding.id, groepId);
        setGedeeldMet((prev) => new Set(prev).add(groepId));
      }
    } catch (err) {
      alert(`Delen wijzigen mislukt: ${err.message}`);
    } finally {
      setBezig((prev) => { const next = new Set(prev); next.delete(groepId); return next; });
    }
  };

  return (
    <div className="card p-3">
      <div className="section-label mb-2">📤 Delen met groep</div>
      {groepen.length === 0 ? (
        <div className="export-card-beschrijving">
          Je hebt nog geen groep waar "Deel mijn meldingen met deze groep" aanstaat —
          zet dat aan op de groepspagina om deze melding hier te kunnen delen.
        </div>
      ) : (
        groepen.map((g) => {
          const actiefDelen = gedeeldMet.has(g.id);
          return (
            <label key={g.id} className="mf-checkbox-label" style={{ marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={actiefDelen}
                disabled={bezig.has(g.id)}
                onChange={() => handleToggle(g.id, actiefDelen)}
              />
              {g.naam}
            </label>
          );
        })
      )}
    </div>
  );
}

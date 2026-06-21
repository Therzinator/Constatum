import { useEffect, useState } from 'react';
import { maakDeeltoken, haalEigenDeeltokens } from '../../lib/supabase/deeltokens.js';
import { zoekPostcodePDOK } from '../../lib/pdok/postcode.js';
import { Toast } from '../ui/Toast.jsx';

// Coordinatie & Admin systeem, Fase 3 — uitnodigingslink voor buren.
// Bewust GEEN directe data-toegang: de link leidt naar de registratie-
// pagina met alleen een aantal-teaser ("X buren melden al mee"), nooit
// naar perceel- of individuele meldingdata (zie migratie 0007/sessie-
// overleg: een teler herkent zijn eigen perceel ook in "geanonimiseerde"
// cijfers).
export function DeeltokenGenerator({ user, thuislocatie }) {
  const [omschrijving, setOmschrijving] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);
  const [laatsteLink, setLaatsteLink] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [melding, setMelding] = useState(null);

  useEffect(() => {
    if (user) haalEigenDeeltokens(user).then(setTokens).catch(() => {});
  }, [user]);

  const handleGenereer = async () => {
    if (!thuislocatie?.lat || !thuislocatie?.lng) {
      setFout('Stel eerst je thuislocatie in (Instellingen) — nodig om het juiste postcodegebied in de link te zetten');
      return;
    }
    setFout(null);
    setBezig(true);
    try {
      const dossier = await maakDeeltoken(user, omschrijving.trim());
      const postcode = await zoekPostcodePDOK(thuislocatie.lat, thuislocatie.lng).catch(() => null);
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('uitnodiging', dossier.token);
      if (postcode) url.searchParams.set('postcode', postcode.slice(0, 4));
      const linkStr = url.toString();
      setLaatsteLink(linkStr);
      setOmschrijving('');
      setTokens(await haalEigenDeeltokens(user));

      try {
        await navigator.clipboard.writeText(linkStr);
        setMelding({ id: Date.now(), tekst: 'Link gekopieerd naar klembord.', type: 'success' });
      } catch {
        // Klembord-API niet beschikbaar/geweigerd (bv. geen HTTPS, geen
        // gebruikersactiviteit meer in dezelfde tick) — de link staat
        // hieronder nog gewoon zichtbaar om handmatig te selecteren.
        setMelding({ id: Date.now(), tekst: 'Link gegenereerd — kopiëren naar klembord mislukt, selecteer hem hieronder.', type: 'error' });
      }
    } catch (err) {
      setFout(err.message);
    } finally {
      setBezig(false);
    }
  };

  if (!user) return null;

  return (
    <div className="card p-4">
      <div className="section-label mb-3">🔗 Buren uitnodigen</div>
      <div className="export-card-beschrijving mb-3">
        Genereert een link naar de registratiepagina (geldig 14 dagen) —
        toont alleen hoeveel buren al meedoen, geen melding- of
        perceeldata.
      </div>

      <label className="export-info-rij">
        <span>Omschrijving (optioneel, bv. "buurman nr. 12")</span>
        <input type="text" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
      </label>

      {fout && <div className="export-card-beschrijving mt-2" style={{ color: 'var(--danger)' }}>{fout}</div>}

      <button type="button" className="btn-outline px-4 py-2 mt-3" disabled={bezig} onClick={handleGenereer}>
        {bezig ? '⏳ Genereren...' : '🔗 Genereer uitnodigingslink'}
      </button>

      {laatsteLink && (
        <div className="export-card-beschrijving mt-3">
          <input type="text" readOnly value={laatsteLink} onFocus={(e) => e.target.select()} style={{ width: '100%' }} />
        </div>
      )}

      {tokens.length > 0 && (
        <div className="mt-3">
          <div className="section-label mb-2">Eerder gegenereerd</div>
          {tokens.map((t) => (
            <div key={t.id} className="export-info-rij">
              <span>{t.omschrijving || '(zonder omschrijving)'}</span>
              <span>{t.gebruikt ? '✓ gebruikt' : new Date(t.expires_at) < new Date() ? 'verlopen' : 'open'}</span>
            </div>
          ))}
        </div>
      )}

      <Toast melding={melding} />
    </div>
  );
}

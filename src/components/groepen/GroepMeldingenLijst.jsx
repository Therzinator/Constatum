import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { haalMeldingenVoorGroep, verwijderMeldingUitGroep } from '../../lib/groepen/groepen.js';
import { bepaalZichtbaarheidsniveau, velden } from '../../lib/groepen/trustZichtbaarheid.js';
import { clusterMeldingen } from '../../lib/meldingen/clustering.js';
import { GroepMeldingKaart } from './GroepMeldingKaart.jsx';
import { GroepClusterKaart } from './GroepClusterKaart.jsx';
import { GroepMeldingDetailModal } from './GroepMeldingDetailModal.jsx';
import '../meldingen/MeldingCard.css';
import '../meldingen/TijdlijnPage.css';
import './GroepMeldingenLijst.css';

// Lazy — trekt OpenLayers (~300-400KB) mee, dat hoort niet in de
// hoofdbundel voor gebruikers die nooit een groep met kaart bekijken
// (zelfde reden als DashboardKaart.jsx/LocatieKaart.jsx hierboven).
const GroepDashboardKaart = lazy(() => import('./GroepDashboardKaart.jsx').then((m) => ({ default: m.GroepDashboardKaart })));

const NIVEAU_LABEL = { laag: 'Laag', gemiddeld: 'Gemiddeld', hoog: 'Hoog' };
const RECENT_AANTAL = 5;

// Zet een ruwe entries_groepen-rij (haalMeldingenVoorGroep) om naar een
// veilige weergavevorm die zowel GroepMeldingKaart/GroepMeldingDetailModal
// (verwachten platte gps_lat/gps_lng) als clusterMeldingen() (verwacht
// genest gps.lat/lng) kan gebruiken — met redactie op basis van `toon`
// (lib/groepen/trustZichtbaarheid.js), zodat een lage-trust-kijker nooit
// exacte locatie/omschrijving/melderinfo binnenkrijgt, ook niet indirect
// via de clustering (perceelnummer/gps tellen mee voor het groeperen,
// maar worden hier al op `null` gezet als exacteLocatie niet mag).
function naarVeiligeWeergave(entry, toon) {
  const heeftLocatie = toon.exacteLocatie && entry.gps_lat != null && entry.gps_lng != null;
  return {
    ...entry,
    description: toon.metadata ? (entry.description || '') : '',
    gemeente: toon.grofweLocatie ? entry.gemeente : null,
    provincie: toon.grofweLocatie ? entry.provincie : null,
    melder_email: toon.melderInfo ? entry.melder_email : null,
    gps_lat: heeftLocatie ? entry.gps_lat : null,
    gps_lng: heeftLocatie ? entry.gps_lng : null,
    perceelnummer: heeftLocatie ? entry.perceelnummer : null,
    gps: heeftLocatie ? { lat: entry.gps_lat, lng: entry.gps_lng } : null
  };
}

// Sectie 1/5 — meldingen binnen een groep, in dezelfde kaart-vorm als
// "Recente meldingen" (Dashboard, MeldingCard.jsx compacte variant) i.p.v.
// een platte tekstlijst. Hoeveel detail elke kaart toont hangt af van de
// trust score van de KIJKER (niet de melder) — de toegangs-gate (is de
// melding wel met deze groep gedeeld) is al RLS-niveau (migratie 0015);
// hier wordt alleen bepaald welke VELDEN getoond worden, via
// src/lib/groepen/trustZichtbaarheid.js (config-gebaseerd, zodat nieuwe
// niveaus later makkelijk toevoegbaar zijn).
//
// Twee weergaven, zelfde onderscheid als Dashboard ("Recente meldingen")
// vs. de persoonlijke Tijdlijn-pagina: "Recent" toont de 5 laatste losse
// meldingen, "Tijdlijn" toont alle meldingen gegroepeerd tot gebeurtenissen
// (clusterMeldingen(), zelfde perceel/locatie + tijdvenster van 8u als de
// persoonlijke Tijdlijn) via GroepClusterKaart.jsx.
export function GroepMeldingenLijst({ groepId, viewerTrustScore, viewerUserId, user, isBeheerder }) {
  const [meldingen, setMeldingen] = useState(null);
  const [fout, setFout] = useState(null);
  const [geopend, setGeopend] = useState(null);
  const [verwijderenId, setVerwijderenId] = useState(null);
  const [modus, setModus] = useState('recent');

  useEffect(() => {
    let actief = true;
    haalMeldingenVoorGroep(groepId)
      .then((data) => { if (actief) setMeldingen(data); })
      .catch((err) => { if (actief) setFout(err.message); });
    return () => { actief = false; };
  }, [groepId]);

  const handleVerwijder = async (meldingId) => {
    if (!confirm('Deze melding uit de groep verwijderen?')) return;
    setVerwijderenId(meldingId);
    try {
      await verwijderMeldingUitGroep(groepId, meldingId);
      setMeldingen((prev) => prev.filter((m) => m.id !== meldingId));
    } catch (err) {
      alert(`Verwijderen mislukt: ${err.message}`);
    } finally {
      setVerwijderenId(null);
    }
  };

  // Beheerders krijgen altijd volledige inzage, ongeacht hun eigen trust score.
  const niveau = isBeheerder ? 'hoog' : bepaalZichtbaarheidsniveau(viewerTrustScore);
  const toon = velden(niveau);

  const veilig = useMemo(
    () => (meldingen || []).map((m) => naarVeiligeWeergave(m, toon)).sort((a, b) => new Date(b.timestamp_local) - new Date(a.timestamp_local)),
    [meldingen, toon]
  );

  const recent = useMemo(() => veilig.slice(0, RECENT_AANTAL), [veilig]);
  const clusters = useMemo(() => (modus === 'tijdlijn' ? clusterMeldingen(veilig) : null), [modus, veilig]);

  if (fout) return <div className="export-card-beschrijving" style={{ color: 'var(--danger)' }}>Meldingen laden mislukt: {fout}</div>;
  if (!meldingen) return <div className="export-card-beschrijving">Meldingen laden...</div>;
  if (meldingen.length === 0) return <div className="export-card-beschrijving">Nog geen meldingen gedeeld met deze groep.</div>;

  return (
    <div>
      <div className="export-card-beschrijving mb-2">
        {isBeheerder
          ? 'Als beheerder heb je volledige inzage in gedeelde meldingen.'
          : <>Jouw zichtbaarheidsniveau in deze groep: <strong>{NIVEAU_LABEL[niveau] || niveau}</strong>, gebaseerd op je eigen trust score.</>}
      </div>

      <div className="mb-2">
        <Suspense fallback={<div className="export-card-beschrijving">Kaart laden...</div>}>
          <GroepDashboardKaart meldingen={veilig} onMeldingSelecteren={setGeopend} />
        </Suspense>
      </div>

      <div className="groepen-meldingen-modus">
        <button type="button" className={`tijdlijn-modus-btn ${modus === 'recent' ? 'actief' : ''}`} onClick={() => setModus('recent')}>
          📋 Recente meldingen
        </button>
        <button type="button" className={`tijdlijn-modus-btn ${modus === 'tijdlijn' ? 'actief' : ''}`} onClick={() => setModus('tijdlijn')}>
          🔗 Tijdlijn
        </button>
      </div>

      {modus === 'recent' ? (
        recent.map((m) => (
          <GroepMeldingKaart
            key={m.id}
            melding={m}
            toon={toon}
            viewerUserId={viewerUserId}
            isBeheerder={isBeheerder}
            verwijderenId={verwijderenId}
            onVerwijder={handleVerwijder}
            onOpen={setGeopend}
          />
        ))
      ) : (
        clusters.map((cluster) => (
          <GroepClusterKaart
            key={cluster.id}
            cluster={cluster}
            toon={toon}
            viewerUserId={viewerUserId}
            isBeheerder={isBeheerder}
            verwijderenId={verwijderenId}
            onVerwijder={handleVerwijder}
            onOpen={setGeopend}
          />
        ))
      )}

      {geopend && (
        <GroepMeldingDetailModal
          melding={geopend}
          toon={toon}
          isEigen={geopend.user_id && geopend.user_id === viewerUserId}
          user={user}
          onClose={() => setGeopend(null)}
        />
      )}
    </div>
  );
}

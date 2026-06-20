import { berekenVoortgang } from '../../lib/meldingen/voortgang.js';
import './VoortgangBalk.css';

// UX-restant (Baymard) uit de legacy-planning: toont hoe volledig het
// meldingformulier is ingevuld, los van de harde validatie (type + omschrijving
// blijven de enige verplichte velden — zie useNieuweMeldingForm.js::submit).
// Rood = nog in te vullen, groen = al ingevuld — zowel als balk (verhouding)
// als losse stappen (welke specifiek), zodat de melder in één oogopslag ziet
// wat er al staat en wat er nog mist. Elke stap is aanklikbaar en springt
// naar het bijbehorende formulieronderdeel (zie onStapKlik in MeldingForm.jsx).
export function VoortgangBalk({ veld, onStapKlik }) {
  const { stappen, percentage } = berekenVoortgang(veld);

  return (
    <div className="voortgang-balk-wrap">
      <div className="voortgang-balk-track">
        <div className="voortgang-balk-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="voortgang-balk-tekst">
        <span>Dossier volledigheid: {percentage}%</span>
      </div>
      <div className="voortgang-stappen">
        {stappen.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`voortgang-stap ${s.klaar ? 'voortgang-stap-klaar' : 'voortgang-stap-open'}`}
            onClick={() => onStapKlik?.(s.key)}
          >
            {s.klaar ? '✓' : '○'} {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

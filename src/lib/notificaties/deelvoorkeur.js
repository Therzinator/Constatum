// Coordinatie & Admin systeem, Fase 3 — standaard opt-in-voorkeur voor het
// delen van nieuwe meldingen met de buurt (opt_in_buurt). Los van
// buurtMelding.js, dat over het bereik van het ONTVANGEN van andermans
// gedeelde meldingen gaat — dit gaat over het zelf delen van eigen
// meldingen. De checkbox per melding (MeldingForm.jsx) blijft altijd
// aanpasbaar; dit is alleen de vooringevulde standaardwaarde bij een
// nieuw formulier.
const SLEUTEL = 'spuitlog_deelvoorkeur_opt_in_buurt';

export function laadDeelVoorkeur() {
  try {
    return localStorage.getItem(SLEUTEL) === 'true';
  } catch {
    return false;
  }
}

export function slaDeelVoorkeurOp(optIn) {
  try {
    localStorage.setItem(SLEUTEL, String(optIn));
  } catch { /* localStorage niet beschikbaar */ }
}

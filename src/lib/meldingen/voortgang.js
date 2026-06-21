// Voortgangsindicatie meldingformulier (Baymard: laat zien hoe volledig een
// lang formulier is, ook voor optionele secties — niet alleen de verplichte
// velden). Geeft een percentage en de afzonderlijke stappen terug.
export function berekenVoortgang(veld) {
  // "zintuiglijk" telt bewust alleen geurIntensiteit en driftWaarneming mee,
  // NIET windSubjectief: dat veld wordt automatisch voorgevuld zodra de
  // weerdata binnenkomt (windSubjectiefVanSnelheid() in
  // useNieuweMeldingForm.js) — meewegen zou deze stap bijna altijd al
  // "klaar" tonen zonder dat de melder er zelf iets voor deed. Zelfde
  // reden waarom driftWaarneming hier alleen telt zodra er meer dan de
  // default ['nvt'] geselecteerd is.
  // Volgorde komt overeen met de volgorde van de secties in het formulier
  // zelf (MeldingForm.jsx) — Teler & gewas staat daar vóór Foto's/video's.
  const stappen = [
    { key: 'locatie', label: 'Locatie op perceel', klaar: Boolean(veld.perceelnummer) },
    { key: 'type', label: 'Type waarneming', klaar: veld.types.length > 0 },
    { key: 'zintuiglijk', label: 'Zintuiglijke waarneming', klaar: veld.geurIntensiteit > 0 || veld.driftWaarneming.some((d) => d !== 'nvt') },
    { key: 'omschrijving', label: 'Omschrijving', klaar: Boolean(veld.description.trim()) },
    { key: 'teler', label: 'Teler & gewas', klaar: Boolean(veld.bedrijfsnaam.trim() || veld.gewas) },
    { key: 'fotos', label: "Foto's/video's", klaar: veld.bestanden.length > 0 }
  ];
  const aantalKlaar = stappen.filter((s) => s.klaar).length;
  return {
    stappen,
    percentage: Math.round((aantalKlaar / stappen.length) * 100)
  };
}

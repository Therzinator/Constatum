// Komt overeen met getBedrijfSuggesties() uit docs/index.html — pure variant
// (meldingen als parameter i.p.v. getMeldingen() aan te roepen). Geeft
// maximaal 6 unieke, eerder ingevoerde bedrijfsnamen terug die de query
// bevatten.
export function bedrijfSuggesties(query, meldingen) {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  const namen = [...new Set(
    meldingen
      .map((m) => m.bedrijfsnaam)
      .filter((n) => n && n.toLowerCase().includes(lower))
  )].sort().slice(0, 6);
  return namen;
}

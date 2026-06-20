// Coordinatie & Admin systeem, Fase 1/4 — postcode bij de meldingslocatie,
// nodig voor het admin-dashboard ("opt-in-melders per postcode"). PDOK
// Locatieserver reverse-lookup geeft het dichtstbijzijnde adres voor een
// coördinaat; we gebruiken alleen het postcode-veld daarvan.
export async function zoekPostcodePDOK(lat, lng) {
  const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?lat=${lat}&lon=${lng}&type=adres&rows=1`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data?.response?.docs?.[0];
  return doc?.postcode || null;
}

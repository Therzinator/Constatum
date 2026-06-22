// Vertraagt de zichtbaarheid van ANDERMANS gedeelde meldingen om de
// identiteit van de melder te beschermen tegen een teler die zich (mogelijk
// onder een valse naam) bij de buurt-groep heeft aangesloten — zonder
// vertraging zou realtime zichtbaarheid verraden wie net heeft gemeld.
// Gebruikt entry.created_at (server-tijdstip van opslaan), niet
// timestamp_local (vrij invoerbaar door de melder zelf, dus niet
// betrouwbaar als vertragingsgrens).
export const BUURT_VERTRAGING_MS = 30 * 60 * 1000;

export function magAndermansMeldingTonen(entry, user) {
  if (!entry?.user_id || entry.user_id === user?.id) return true; // eigen melding: altijd direct zichtbaar
  const aangemaakt = entry.created_at ? new Date(entry.created_at) : null;
  if (!aangemaakt || Number.isNaN(aangemaakt.getTime())) return false; // geen betrouwbaar tijdstip — niet tonen
  return Date.now() - aangemaakt.getTime() >= BUURT_VERTRAGING_MS;
}

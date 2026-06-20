import { sbClient } from './client.js';

// Coordinatie & Admin systeem, Fase 3 — trust-indicator voor de melder.
// Leest user_profiles (schema uit migratie 0002/0003): trust_score,
// telefoon_geverifieerd, account_aangemaakt. Geeft null terug als er nog
// geen profielrij bestaat (bv. account aangemaakt vóór migratie 0002) —
// de UI toont dan gewoon geen trust-indicator i.p.v. een foutmelding.
export async function haalGebruikersProfiel(userId) {
  const sb = sbClient();
  if (!sb || !userId) return null;

  const { data, error } = await sb
    .from('user_profiles')
    .select('trust_score, telefoon_geverifieerd, account_aangemaakt')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Profiel] Ophalen mislukt:', error.message);
    return null;
  }
  return data;
}

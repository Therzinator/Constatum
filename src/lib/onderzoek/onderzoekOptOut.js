import { sbClient } from '../supabase/client.js';

// Onderzoeksdata opt-out (werkfase H) — standaard AAN (opt-out-model): bij
// uitschakelen wordt onderzoek_opt_out=true gezet op user_profiles
// (migratie 0008). Lokaal gecachet zodat de toggle ook offline meteen de
// juiste stand toont; Supabase is de bron van waarheid zodra die bereikbaar is.
const SLEUTEL = 'spuitlogger_onderzoek_optout';

export function laadOnderzoekOptOutLokaal() {
  try {
    return localStorage.getItem(SLEUTEL) === 'true';
  } catch {
    return false;
  }
}

function slaOnderzoekOptOutLokaalOp(optOut) {
  try {
    localStorage.setItem(SLEUTEL, String(optOut));
  } catch { /* localStorage niet beschikbaar */ }
}

export async function laadOnderzoekOptOut(userId) {
  const sb = sbClient();
  if (!sb || !userId) return laadOnderzoekOptOutLokaal();

  const { data, error } = await sb
    .from('user_profiles')
    .select('onderzoek_opt_out')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Onderzoek] Opt-out ophalen mislukt:', error.message);
    return laadOnderzoekOptOutLokaal();
  }
  const optOut = data?.onderzoek_opt_out ?? false;
  slaOnderzoekOptOutLokaalOp(optOut);
  return optOut;
}

export async function slaOnderzoekOptOutOp(userId, optOut) {
  slaOnderzoekOptOutLokaalOp(optOut);

  const sb = sbClient();
  if (!sb || !userId) return false;

  const { error } = await sb
    .from('user_profiles')
    .update({ onderzoek_opt_out: optOut })
    .eq('id', userId);

  if (error) {
    console.warn('[Onderzoek] Opt-out opslaan mislukt:', error.message);
    return false;
  }
  return true;
}

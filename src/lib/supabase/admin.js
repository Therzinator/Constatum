import { sbClient } from './client.js';

// Coordinatie & Admin systeem, Fase 4 — admin-queries. Vertrouwt op de
// admin-RLS-bypass uit migratie 0004: een admin krijgt via deze simpele
// .select()-calls automatisch ALLE rijen terug (niet alleen eigen/opt-in),
// een gewone gebruiker alleen zijn eigen rijen — de scheiding gebeurt
// database-side, niet hier.
export async function haalAlleEntriesAdmin() {
  const sb = sbClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from('entries')
    .select('id, user_id, melder_email, timestamp_local, type, description, postcode, perceelnummer, opt_in_buurt, visibility, gps_lat, gps_lng')
    .eq('deleted', false)
    .order('timestamp_local', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function haalAlleProfielenAdmin() {
  const sb = sbClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from('user_profiles')
    .select('id, trust_score, telefoon_geverifieerd, account_aangemaakt');

  if (error) throw error;
  return data || [];
}

export async function zetTrustScoreAdmin(userId, trustScore) {
  const sb = sbClient();
  if (!sb) return;

  const { error } = await sb
    .from('user_profiles')
    .update({ trust_score: trustScore })
    .eq('id', userId);

  if (error) throw error;
}

export async function zetVisibilityAdmin(entryId, visibility) {
  const sb = sbClient();
  if (!sb) return;

  const { error } = await sb
    .from('entries')
    .update({ visibility })
    .eq('id', entryId);

  if (error) throw error;
}

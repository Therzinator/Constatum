import { sbClient } from './client.js';

const GELDIGHEID_DAGEN = 14;

// Coordinatie & Admin systeem, Fase 3 — deeltoken als uitnodiging-naar-
// registratie. Geen directe data-toegang: zie migratie 0007 voor de
// achterliggende afweging (zelfs geanonimiseerde perceeldata zou een
// teler zichzelf laten herkennen).
export async function maakDeeltoken(user, omschrijving) {
  const sb = sbClient();
  if (!sb || !user) return null;

  const expiresAt = new Date(Date.now() + GELDIGHEID_DAGEN * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from('coordinatie_tokens')
    .insert({ user_id: user.id, omschrijving: omschrijving || null, expires_at: expiresAt })
    .select('id, token, omschrijving, expires_at, gebruikt, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function haalEigenDeeltokens(user) {
  const sb = sbClient();
  if (!sb || !user) return [];

  const { data, error } = await sb
    .from('coordinatie_tokens')
    .select('id, omschrijving, expires_at, gebruikt, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Publiek aanroepbaar (ook zonder account) — geeft alleen een aantal
// terug, nooit perceel- of individuele meldingdata (zie migratie 0007).
export async function haalBuurtTelling(postcodePrefix) {
  const sb = sbClient();
  if (!sb || !postcodePrefix) return null;

  const { data, error } = await sb.rpc('publieke_buurt_telling', { postcode_prefix: postcodePrefix });
  if (error) return null;
  return data;
}

// Zet een token op gebruikt — vereist een ingelogde gebruiker (de net
// geregistreerde uitgenodigde), maar niet dat die de token-rij zelf mag
// lezen/schrijven (gebeurt server-side in de SECURITY DEFINER-functie).
export async function verbruikDeeltoken(token) {
  const sb = sbClient();
  if (!sb || !token) return false;

  const { data, error } = await sb.rpc('verbruik_coordinatie_token', { token_input: token });
  if (error) return false;
  return Boolean(data);
}

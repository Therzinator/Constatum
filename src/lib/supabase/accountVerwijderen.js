import { sbClient } from './client.js';

// "Verwijder mijn account" (werkfase H) — zet alle eigen entries op
// deleted=true (zelfde soft-delete vlag die laadVanSupabase() al filtert,
// zie entries.js) en verwijdert de profielrij. Volledige verwijdering van
// het auth.users-record kan alleen met een service-role key (server-side
// Edge Function), niet met de anon/authenticated-key vanuit de client —
// dat is hier dus bewust buiten scope. De aanroeper logt na deze functie
// zelf uit en wist de lokale data (zie useMeldingen.js::verwijderAlleMeldingenLokaal).
export async function verwijderAccountData(userId) {
  const sb = sbClient();
  if (!sb || !userId) return false;

  const { error: entriesError } = await sb
    .from('entries')
    .update({ deleted: true })
    .eq('user_id', userId);
  if (entriesError) {
    console.error('[Account] Verwijderen van entries mislukt:', entriesError.message);
    return false;
  }

  const { error: profielError } = await sb
    .from('user_profiles')
    .delete()
    .eq('id', userId);
  if (profielError) {
    console.warn('[Account] Verwijderen van profielrij mislukt:', profielError.message);
  }

  return true;
}

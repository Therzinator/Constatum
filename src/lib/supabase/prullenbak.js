import { sbClient } from './client.js';
import { sbAuditLog } from './auditLog.js';

// Komt overeen met het query-deel van laadVerwijderdeMeldingen() uit
// docs/index.html — verwijderde (deleted=true) entries van de afgelopen
// `dagen`, aflopend gesorteerd. Geeft de ruwe rijen terug (geen DOM).
export async function haalVerwijderdeMeldingen(dagen) {
  const sb = sbClient();
  if (!sb) return [];

  const vanaf = new Date(Date.now() - dagen * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from('entries')
    .select('id, timestamp_local, type, description, melder_email, user_id')
    .eq('deleted', true)
    .or(`updated_at.gte.${vanaf},timestamp_local.gte.${vanaf}`)
    .order('timestamp_local', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Komt overeen met herstelMelding() uit docs/index.html.
export async function herstelMeldingInCloud(id, user) {
  const sb = sbClient();
  if (!sb) return;

  const { error } = await sb.from('entries').update({ deleted: false }).eq('id', id);
  if (error) throw error;

  await sbAuditLog(id, 'restored', { door: user?.id, rol: 'admin' }, user);
}

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// TIJDELIJK: Supabase-inlogpogingen via localhost veroorzaakten crashes
// (oorzaak nog niet vastgesteld) — tot dat is uitgezocht, draait de app op
// localhost altijd in lokaal-alleen-modus (geen auth-overlay, geen sync).
// Op een eigen domein (productie) blijft Supabase wel actief.
const IS_LOCALHOST = typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON) && !IS_LOCALHOST;

let _sb = null; // Supabase client instance

export function sbClient() {
  if (!SUPABASE_ENABLED) return null;
  if (_sb) return _sb;
  try {
    _sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return _sb;
  } catch (e) {
    console.error('[Supabase] Client aanmaken mislukt:', e);
    return null;
  }
}

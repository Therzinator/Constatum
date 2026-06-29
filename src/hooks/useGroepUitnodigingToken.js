import { useEffect, useMemo, useRef, useState } from 'react';
import { accepteerUitnodiging } from '../lib/groepen/uitnodigingen.js';

// Token overleeft email-verificatie niet als we hem alleen in React state
// bewaren — na de Supabase-verificatiemail redirect herlaadt de app zonder
// de ?groepuitnodiging=-param. localStorage bridget die gap.
const STORAGE_KEY = 'spuitlogger_groepuitnodiging';

// Groepenfunctie — vervangt useUitnodigingToken.js (verwijderd samen met
// de oude deeltoken-flow, zie DECISIONS.md). Leest ?groepuitnodiging=<token>
// uit de URL, haalt 'm meteen uit de adresbalk, en accepteert de
// uitnodiging zodra de uitgenodigde daadwerkelijk een account heeft (niet
// eerder — anders zou alleen het OPENEN van de link al als "gebruikt" tellen).
// onGroepGejoint wordt aangeroepen met de groep_id na succesvolle acceptatie.
export function useGroepUitnodigingToken(user, onGroepGejoint) {
  const [token] = useState(() => {
    // URL-param heeft prioriteit (verse klik op uitnodigingslink).
    // localStorage-fallback vangt de terugkeer na email-verificatie op.
    const urlToken = new URLSearchParams(window.location.search).get('groepuitnodiging');
    if (urlToken) {
      localStorage.setItem(STORAGE_KEY, urlToken);
      return urlToken;
    }
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const geaccepteerdRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    params.delete('groepuitnodiging');
    const nieuweUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', nieuweUrl);
  }, [token]);

  useEffect(() => {
    if (user && token && !geaccepteerdRef.current) {
      geaccepteerdRef.current = true;
      accepteerUitnodiging(token)
        .then((groepId) => {
          localStorage.removeItem(STORAGE_KEY);
          if (groepId) onGroepGejoint?.(groepId);
        })
        .catch(() => {
          // Verlopen/ongeldige token — ook opruimen zodat hij niet bij elke
          // login opnieuw geprobeerd wordt.
          localStorage.removeItem(STORAGE_KEY);
        });
    }
  }, [user, token, onGroepGejoint]);

  // Memoized i.p.v. elke render een nieuw object — anders kreeg
  // AuthOverlay.jsx's effect (`if (uitnodiging) setAuthMode('signup')`)
  // bij ELKE re-render een "nieuwe" waarde te zien en zette authMode
  // steeds terug naar 'signup', ook nadat de gebruiker zelf naar
  // "Inloggen" was overgeschakeld — een bestaande gebruiker kon zo nooit
  // inloggen via een uitnodigingslink.
  return useMemo(() => (token ? { token } : null), [token]);
}

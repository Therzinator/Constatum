import { useEffect, useRef, useState } from 'react';
import { verbruikDeeltoken } from '../lib/supabase/deeltokens.js';

// Coordinatie & Admin systeem, Fase 3 — leest ?uitnodiging=<token>&postcode=
// uit de URL (gegenereerd door DeeltokenGenerator.jsx), haalt 'm meteen uit
// de adresbalk, en verbruikt de token zodra de uitgenodigde daadwerkelijk
// een account heeft (niet eerder — anders zou alleen het OPENEN van de
// link al telt als "gebruikt").
export function useUitnodigingToken(user) {
  const [uitnodiging] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('uitnodiging');
    return token ? { token, postcode: params.get('postcode') } : null;
  });
  const verbruiktRef = useRef(false);

  useEffect(() => {
    if (!uitnodiging) return;
    const params = new URLSearchParams(window.location.search);
    params.delete('uitnodiging');
    params.delete('postcode');
    const nieuweUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', nieuweUrl);
  }, [uitnodiging]);

  useEffect(() => {
    if (user && uitnodiging?.token && !verbruiktRef.current) {
      verbruiktRef.current = true;
      verbruikDeeltoken(uitnodiging.token);
    }
  }, [user, uitnodiging]);

  return uitnodiging;
}

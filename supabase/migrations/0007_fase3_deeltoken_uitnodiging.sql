-- Coordinatie & Admin systeem, Fase 3 — deeltoken als uitnodiging-naar-
-- registratie (NIET als directe kijktoegang, zie sessie-overleg: een
-- ongeauthenticeerde link met perceel-/buurtdata zou een kwaadwillende
-- teler evenveel inzicht geven als een melder — ook geanonimiseerd, want
-- de teler herkent zijn eigen perceelnummer toch). Handmatig uitvoeren in
-- de Supabase SQL-editor, in losse stappen.
--
-- Twee smalle, publiek aanroepbare functies i.p.v. de coordinatie_tokens-
-- tabel zelf open te stellen (die blijft achter de eigen-rij-RLS uit
-- migratie 0006):
-- 1. publieke_buurt_telling: alleen een AANTAL opt-in-melders in een
--    postcodegebied — geen perceelnummers, geen individuele meldingen.
-- 2. verbruik_coordinatie_token: zet gebruikt=true voor een token, zonder
--    dat de aanroeper de rij zelf mag lezen/schrijven via normale RLS.

-- Stap 1
CREATE OR REPLACE FUNCTION publieke_buurt_telling(postcode_prefix text)
RETURNS integer AS $$
  SELECT count(DISTINCT user_id)::integer
  FROM entries
  WHERE deleted = false
    AND opt_in_buurt = true
    AND postcode ILIKE postcode_prefix || '%';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Stap 2
GRANT EXECUTE ON FUNCTION publieke_buurt_telling(text) TO anon, authenticated;

-- Stap 3
CREATE OR REPLACE FUNCTION verbruik_coordinatie_token(token_input text)
RETURNS boolean AS $$
DECLARE
  geldig boolean;
BEGIN
  SELECT (expires_at IS NULL OR expires_at > now()) AND gebruikt = false
  INTO geldig
  FROM coordinatie_tokens
  WHERE token = token_input;

  IF geldig IS NOT TRUE THEN
    RETURN false;
  END IF;

  UPDATE coordinatie_tokens SET gebruikt = true WHERE token = token_input;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stap 4
GRANT EXECUTE ON FUNCTION verbruik_coordinatie_token(text) TO authenticated;

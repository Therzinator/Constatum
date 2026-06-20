-- Coordinatie & Admin systeem, Fase 5 — misbruikdetectie. Handmatig
-- uitvoeren in de Supabase SQL-editor, in losse stappen (zie migratie
-- 0003 — de SQL-editor verslikt zich soms in meerdere statements na een
-- functie-body met $$...$$).

-- Stap 1: fn_entries_set_visibility (migratie 0003) uitbreiden — een
-- trust_score < 40 (door misbruikdetectie hieronder) zet nieuwe
-- meldingen op 'shadow' i.p.v. de bestaande nieuw-account-checks. Leest
-- het trust_score VAN VOOR deze insert, dus alleen eerder vastgesteld
-- misbruik beïnvloedt de zichtbaarheid van een nieuwe melding.
CREATE OR REPLACE FUNCTION fn_entries_set_visibility()
RETURNS trigger AS $$
DECLARE
  account_leeftijd interval;
  meldingen_vandaag integer;
  huidige_trust_score integer;
BEGIN
  SELECT trust_score INTO huidige_trust_score
  FROM user_profiles
  WHERE id = NEW.user_id;

  IF huidige_trust_score IS NOT NULL AND huidige_trust_score < 40 THEN
    NEW.visibility := 'shadow';
    RETURN NEW;
  END IF;

  SELECT now() - u.created_at INTO account_leeftijd
  FROM auth.users u
  WHERE u.id = NEW.user_id;

  IF account_leeftijd IS NULL THEN
    RETURN NEW;
  END IF;

  IF account_leeftijd < interval '48 hours' THEN
    NEW.visibility := 'under_review';
    RETURN NEW;
  END IF;

  IF account_leeftijd < interval '7 days' THEN
    SELECT count(*) INTO meldingen_vandaag
    FROM entries
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '1 day';

    IF meldingen_vandaag >= 5 THEN
      NEW.visibility := 'under_review';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stap 2: misbruikdetectie-functie + AFTER INSERT trigger. Verlaagt
-- trust_score van de melder zelf (niet van anderen die toevallig op
-- hetzelfde perceel melden):
-- - >10 meldingen van DEZELFDE gebruiker op hetzelfde perceel binnen 24u
--   -> -20 (eenmalig bij het overschrijden van de drempel, niet bij elke
--   volgende melding daarna, om niet te blijven doortellen).
-- - Identieke beschrijvingstekst van dezelfde gebruiker (2e keer exact
--   dezelfde tekst) -> -15, ook eenmalig.
-- Score blijft altijd tussen 0 en 100 (GREATEST/LEAST).
CREATE OR REPLACE FUNCTION fn_entries_misbruikdetectie()
RETURNS trigger AS $$
DECLARE
  perceel_aantal integer;
  beschrijving_aantal integer;
BEGIN
  IF NEW.perceelnummer IS NOT NULL THEN
    SELECT count(*) INTO perceel_aantal
    FROM entries
    WHERE user_id = NEW.user_id
      AND perceelnummer = NEW.perceelnummer
      AND created_at > now() - interval '24 hours';

    IF perceel_aantal = 11 THEN
      UPDATE user_profiles
      SET trust_score = GREATEST(0, LEAST(100, trust_score - 20))
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  IF NEW.description IS NOT NULL AND length(trim(NEW.description)) > 0 THEN
    SELECT count(*) INTO beschrijving_aantal
    FROM entries
    WHERE user_id = NEW.user_id
      AND description = NEW.description;

    IF beschrijving_aantal = 2 THEN
      UPDATE user_profiles
      SET trust_score = GREATEST(0, LEAST(100, trust_score - 15))
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_entries_misbruikdetectie ON entries;
CREATE TRIGGER trg_entries_misbruikdetectie
  AFTER INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION fn_entries_misbruikdetectie();

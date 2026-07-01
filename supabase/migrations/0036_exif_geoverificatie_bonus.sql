-- Migratie 0036: EXIF-geoverificatie-bonus voor trust score
--
-- Client (lib/bewijsmateriaal/exif.js, verifieerEXIFLocatie()) vergelijkt
-- de GPS/tijd uit de foto-EXIF met de door de melder gekozen locatie/tijd
-- en slaat het resultaat op als bestand.exif_verificatie:
--   { overeenkomst: boolean, afstand_m: number, tijdsverschil_min: number|null }
-- (of null als er geen GPS in de EXIF zat — o.a. altijd het geval bij foto's
-- die via de iOS-systeem-deelsheet binnenkomen, EXIF is dan al gestript).
--
-- Deze migratie:
--   1. Voegt de kolom toe op attachments.
--   2. Voegt een nieuwe actie 'exif_geverifieerd' (+2, eenmalig per entry —
--      bestaande Guard 3-deduplicatie in fn_trust_score_actie_bonus voorkomt
--      dubbele bonus bij meerdere geverifieerde foto's op dezelfde melding)
--      toe aan de bestaande fn_trust_score_actie_bonus (laatst gewijzigd in
--      migratie 0028 — p_entry_id is daar al TEXT, niet bigint, en de lokale
--      variabele heet v_delta; deze migratie herdefinieert de functie met
--      exact diezelfde signatuur/structuur plus de nieuwe CASE-tak, gecontroleerd
--      tegen de live productiedefinitie vóór het schrijven van dit bestand).
--   3. Trigger op attachments die de bonus toekent zodra een bijlage met
--      overeenkomst=true wordt ingevoegd of bijgewerkt.
--
-- Zelfde 5 guards als de overige acties (accountleeftijd, minimaal 5 normale
-- meldingen, dedup, dagelijkse cap, entry-visibility/perceel-spam) — hier
-- ongewijzigd, alleen de CASE-tak in fn_trust_score_actie_bonus is uitgebreid.

ALTER TABLE attachments ADD COLUMN IF NOT EXISTS exif_verificatie jsonb;

-- ── fn_trust_score_actie_bonus: 'exif_geverifieerd' toegevoegd aan de CASE ──
CREATE OR REPLACE FUNCTION fn_trust_score_actie_bonus(
  p_user_id  uuid,
  p_actie    text,
  p_entry_id text DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  account_leeftijd  interval;
  normale_meldingen integer;
  dagelijkse_bonus  integer;
  misbruik_count    integer;
  v_delta           integer := 0;
  p_entry           entries%ROWTYPE;
BEGIN
  -- Guard 1: account moet >= 30 dagen oud zijn
  SELECT now() - u.created_at INTO account_leeftijd
  FROM auth.users u WHERE u.id = p_user_id;
  IF account_leeftijd IS NULL OR account_leeftijd < interval '30 days' THEN
    RETURN 0;
  END IF;

  -- Guard 2: minimaal 5 normale meldingen als schone basis
  SELECT count(*) INTO normale_meldingen
  FROM entries
  WHERE user_id = p_user_id
    AND visibility = 'normal'
    AND deleted = false;
  IF normale_meldingen < 5 THEN
    RETURN 0;
  END IF;

  -- Guard 3: deduplicatie
  IF p_entry_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM trust_score_events
      WHERE user_id = p_user_id AND actie = p_actie AND entry_id = p_entry_id
    ) THEN RETURN 0; END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM trust_score_events
      WHERE user_id = p_user_id AND actie = p_actie
    ) THEN RETURN 0; END IF;
  END IF;

  -- Guard 4: dagelijkse cap (+5 per dag) alleen voor per-entry bonussen
  IF p_entry_id IS NOT NULL THEN
    SELECT COALESCE(SUM(tse.delta), 0) INTO dagelijkse_bonus
    FROM trust_score_events tse
    WHERE tse.user_id = p_user_id
      AND tse.created_at > now() - interval '1 day'
      AND tse.delta > 0
      AND tse.entry_id IS NOT NULL;
    IF dagelijkse_bonus >= 5 THEN RETURN 0; END IF;
  END IF;

  -- Guard 5: entry-specifieke checks (visibility + misbruikpatroon)
  IF p_entry_id IS NOT NULL THEN
    SELECT * INTO p_entry FROM entries WHERE id = p_entry_id;

    IF p_entry.visibility IN ('shadow', 'under_review') THEN
      RETURN 0;
    END IF;

    IF p_entry.perceelnummer IS NOT NULL THEN
      SELECT count(*) INTO misbruik_count
      FROM entries
      WHERE user_id = p_user_id
        AND perceelnummer = p_entry.perceelnummer
        AND created_at > now() - interval '24 hours'
        AND deleted = false;
      IF misbruik_count >= 5 THEN RETURN 0; END IF;
    END IF;
  END IF;

  -- Delta per actie
  v_delta := CASE p_actie
    WHEN 'melding_volledig'      THEN 2
    WHEN 'opt_in_buurt'         THEN 3
    WHEN 'drempel_5_meldingen'  THEN 3
    WHEN 'drempel_10_meldingen' THEN 5
    WHEN 'drempel_25_meldingen' THEN 5
    WHEN 'drempel_50_meldingen' THEN 5
    WHEN 'telefoon_geverifieerd' THEN 8
    WHEN 'exif_geverifieerd'     THEN 2
    ELSE 0
  END;
  IF v_delta = 0 THEN RETURN 0; END IF;

  -- Dagelijkse cap afkappen (alleen voor per-entry)
  IF p_entry_id IS NOT NULL THEN
    v_delta := LEAST(v_delta, 5 - dagelijkse_bonus);
    IF v_delta <= 0 THEN RETURN 0; END IF;
  END IF;

  INSERT INTO trust_score_events(user_id, actie, delta, entry_id)
  VALUES (p_user_id, p_actie, v_delta, p_entry_id);

  UPDATE user_profiles
  SET trust_score = GREATEST(0, LEAST(100, trust_score + v_delta))
  WHERE id = p_user_id;

  RETURN v_delta;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Trigger op attachments: exif_geverifieerd-bonus ────────────────────────
-- attachments.entry_id is text (fk naar entries.id, zelfde 'DL-…'-formaat),
-- dus rechtstreeks doorgeven aan fn_trust_score_actie_bonus zonder cast.
CREATE OR REPLACE FUNCTION fn_attachments_exif_bonus()
RETURNS trigger AS $$
BEGIN
  IF NEW.exif_verificatie IS NOT NULL
     AND (NEW.exif_verificatie->>'overeenkomst') = 'true'
  THEN
    PERFORM fn_trust_score_actie_bonus(NEW.user_id, 'exif_geverifieerd', NEW.entry_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_attachments_exif_bonus ON attachments;
CREATE TRIGGER trg_attachments_exif_bonus
  AFTER INSERT OR UPDATE OF exif_verificatie ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION fn_attachments_exif_bonus();

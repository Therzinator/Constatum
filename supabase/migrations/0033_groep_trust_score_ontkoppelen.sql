-- Migratie 0033: ontkoppel groep-trust-score van globale trust-score
--
-- Probleem (migratie 0015): fn_groep_trust_score_wijzigen schreef rechtstreeks
-- naar user_profiles.trust_score — daardoor kon een groepsbeheerder de globale
-- trust-score van leden omzeilen/verhogen buiten het normale tier-systeem om.
--
-- Oplossing:
-- 1. Nieuwe kolom groep_leden.groep_trust_score (per-groep, default 75).
--    Volledig los van user_profiles.trust_score.
-- 2. fn_groep_trust_score_wijzigen schrijft nu naar groep_leden.groep_trust_score,
--    nooit meer naar user_profiles.
-- 3. fn_groep_lid_trust_scores leest groep_trust_score, maar geeft altijd 100
--    terug voor beheerder/hoofdbeheerder in hun eigen groep.

-- 1. Per-groep trust-score kolom
ALTER TABLE groep_leden
  ADD COLUMN IF NOT EXISTS groep_trust_score integer NOT NULL DEFAULT 75
  CHECK (groep_trust_score >= 0 AND groep_trust_score <= 100);

-- 2. Herstel fn_groep_trust_score_wijzigen — schrijft naar groep_leden, niet user_profiles.
--    Extra beveiliging: beheerders kunnen hun eigen score niet aanpassen, en
--    ook niet de score van andere beheerders/hoofdbeheerders — alleen leden.
CREATE OR REPLACE FUNCTION fn_groep_trust_score_wijzigen(
  p_groep_id       uuid,
  p_target_user_id uuid,
  p_nieuwe_score   integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mag_wijzigen boolean;
BEGIN
  SELECT (
    -- aanvrager is beheerder of hoofdbeheerder in deze groep
    EXISTS (
      SELECT 1 FROM groep_leden
      WHERE groep_id = p_groep_id
        AND user_id = auth.uid()
        AND rol IN ('beheerder', 'hoofdbeheerder')
    )
    -- doelgebruiker is gewoon lid (niet zichzelf, niet een andere beheerder)
    AND EXISTS (
      SELECT 1 FROM groep_leden
      WHERE groep_id = p_groep_id
        AND user_id = p_target_user_id
        AND rol = 'lid'
    )
    -- beheerder mag niet zijn eigen score aanpassen
    AND p_target_user_id <> auth.uid()
  ) INTO mag_wijzigen;

  IF NOT mag_wijzigen THEN
    RETURN false;
  END IF;

  UPDATE groep_leden
  SET groep_trust_score = GREATEST(0, LEAST(100, p_nieuwe_score))
  WHERE groep_id = p_groep_id AND user_id = p_target_user_id;

  RETURN FOUND;
END;
$$;

-- 3. Herstel fn_groep_lid_trust_scores — gebruikt groep_trust_score, niet user_profiles.
--    Beheerder/hoofdbeheerder krijgt altijd 100 terug in hun eigen groep.
--    Geen join op user_profiles meer nodig.
CREATE OR REPLACE FUNCTION fn_groep_lid_trust_scores(p_groep_id uuid)
RETURNS TABLE (user_id uuid, trust_score integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gl.user_id,
    CASE
      WHEN gl.rol IN ('beheerder', 'hoofdbeheerder') THEN 100
      ELSE gl.groep_trust_score
    END AS trust_score
  FROM groep_leden gl
  WHERE gl.groep_id = p_groep_id
    AND EXISTS (
      SELECT 1 FROM groep_leden aanvrager
      WHERE aanvrager.groep_id  = p_groep_id
        AND aanvrager.user_id   = auth.uid()
        AND aanvrager.rol IN ('beheerder', 'hoofdbeheerder')
    );
$$;

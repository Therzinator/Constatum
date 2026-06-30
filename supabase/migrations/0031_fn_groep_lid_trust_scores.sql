-- Migratie 0031: lees trust-scores van groepsleden voor beheerders
--
-- Probleem: RLS op user_profiles laat een gewone groepsbeheerder niet toe
-- om de trust_score van andere gebruikers te lezen (alleen admin/coordinator
-- heeft dat recht via migratie 0011). Beheerders van een groep moeten echter
-- wél de scores van hun groepsleden kunnen inzien om toe te zien op kwaliteit.
--
-- Oplossing: SECURITY DEFINER functie die de RLS omzeilt, maar de caller
-- verifieert: alleen beheerder/hoofdbeheerder van de gevraagde groep krijgt data.

CREATE OR REPLACE FUNCTION fn_groep_lid_trust_scores(p_groep_id uuid)
RETURNS TABLE (user_id uuid, trust_score integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id AS user_id, up.trust_score
  FROM user_profiles up
  JOIN groep_leden gl ON gl.user_id = up.id
  WHERE gl.groep_id = p_groep_id
    AND EXISTS (
      SELECT 1 FROM groep_leden aanvrager
      WHERE aanvrager.groep_id = p_groep_id
        AND aanvrager.user_id = auth.uid()
        AND aanvrager.rol IN ('beheerder', 'hoofdbeheerder')
    );
$$;

GRANT EXECUTE ON FUNCTION fn_groep_lid_trust_scores(uuid) TO authenticated;

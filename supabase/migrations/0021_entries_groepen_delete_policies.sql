-- Migratie 0021: DELETE-rechten op entries_groepen
--
-- Doel:
-- 1. Melders kunnen hun eigen meldingen uit alle groepen verwijderen
--    (sync bij verwijdering van de tijdlijn, task 1).
-- 2. Groep-beheerders en hoofdbeheerders kunnen elke melding uit hun
--    eigen groep verwijderen (task 2).
--
-- RLS-aanpak: twee losse policies, beide FOR DELETE.
-- Geen fn_-wrapper nodig: de subqueries raken andere tabellen (entries,
-- groep_leden) en veroorzaken daardoor geen recursie.

-- Policy 1 — melder verwijdert eigen melding uit alle groepen
CREATE POLICY entries_groepen_delete_eigen
  ON entries_groepen
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      WHERE e.id = entries_groepen.entry_id
        AND e.user_id = auth.uid()
    )
  );

-- Policy 2 — groepbeheerder/hoofdbeheerder verwijdert melding uit zijn groep
CREATE POLICY entries_groepen_delete_beheerder
  ON entries_groepen
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM groep_leden gl
      WHERE gl.groep_id = entries_groepen.groep_id
        AND gl.user_id = auth.uid()
        AND gl.rol IN ('beheerder', 'hoofdbeheerder')
    )
  );

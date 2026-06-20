-- Coordinatie & Admin systeem, Fase 4 — database-fundament voor het
-- admin-panel. Handmatig uitvoeren in de Supabase SQL-editor, in losse
-- stappen (zie migratie 0003 — de SQL-editor verslikt zich soms in
-- meerdere statements na een functie-body met $$...$$).

-- Stap 1: postcode bij de meldingslocatie (PDOK-lookup t.t.v. opslaan,
-- zie lib/pdok/postcode.js), nodig voor het "opt-in-melders per postcode"
-- dashboard-onderdeel.
ALTER TABLE entries ADD COLUMN IF NOT EXISTS postcode text;

-- Stap 2: admin-RLS-bypass op entries. De SELECT-policy uit migratie 0001
-- (auth.uid() = user_id OR opt_in_buurt = true) had geen admin-uitzondering
-- — een admin kon dus niet alle meldingen zien/beheren. Vervangt die policy
-- en voegt een UPDATE-policy toe (nodig voor bv. PrullenbakCard-herstel en
-- visibility-moderatie door een admin op meldingen van andere gebruikers).
DROP POLICY IF EXISTS "entries_select_eigen_of_opt_in" ON entries;
CREATE POLICY "entries_select_eigen_opt_in_of_admin" ON entries
  FOR SELECT USING (
    auth.uid() = user_id
    OR opt_in_buurt = true
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "entries_update_eigen_of_admin" ON entries;
CREATE POLICY "entries_update_eigen_of_admin" ON entries
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Stap 3: admin mag alle user_profiles lezen (trust-score-verdeling,
-- melder-overzicht) en bijwerken (trust-score-beheer-UI). Gewone
-- gebruikers blijven beperkt tot hun eigen profiel.
DROP POLICY IF EXISTS "user_profiles_select_eigen_of_admin" ON user_profiles;
CREATE POLICY "user_profiles_select_eigen_of_admin" ON user_profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "user_profiles_update_eigen_of_admin" ON user_profiles;
CREATE POLICY "user_profiles_update_eigen_of_admin" ON user_profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

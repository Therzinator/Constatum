-- Werkfase H — onderzoeksdata opt-out (Instellingen → Gegevens & Privacy).
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie CLAUDE.md "Database-schema (Supabase)").
--
-- Standaard false (= gebruiker draagt standaard bij, opt-out-model conform
-- de privacyverklaring artikel 3). De React-app leest/schrijft deze kolom
-- via src/lib/onderzoek/onderzoekOptOut.js.

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onderzoek_opt_out boolean DEFAULT false;

-- RLS: user_profiles heeft al een UPDATE-policy die eigenaren hun eigen rij
-- laat bijwerken (migratie 0004, "user_profiles_update_eigen_of_admin") —
-- die dekt deze kolom al. Er bestaat nog geen DELETE-policy; die is nodig
-- voor "Verwijder mijn account" (zie src/lib/supabase/accountVerwijderen.js).
DROP POLICY IF EXISTS "user_profiles_delete_eigen_of_admin" ON user_profiles;
CREATE POLICY "user_profiles_delete_eigen_of_admin" ON user_profiles
  FOR DELETE USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

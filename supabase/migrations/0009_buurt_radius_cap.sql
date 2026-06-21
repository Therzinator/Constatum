-- Privacy-fix: een teler kon tot nu toe ALLE opt_in_buurt-meldingen
-- landelijk lezen (migratie 0004's policy checkte alleen de boolean, geen
-- afstand) — dus ook meldingen die ver van zijn eigen thuislocatie vandaan
-- liggen, puur door zelf een account aan te maken. Dat maakt het mogelijk
-- om vanaf een teler-adres landelijk mee te kijken met binnenkomende
-- meldingen. Deze policy voegt een harde afstandsgrens van 5 km toe tussen
-- de THUISLOCATIE van de lezer (user_roles) en de GPS-locatie van de
-- melding — bovenop opt_in_buurt = true, niet in plaats van. De
-- notificatie-instelling (Instellingen → Bereik, max 1-5 km, zie
-- lib/notificaties/buurtMelding.js) kan binnen deze 5 km alleen nog
-- vérnauwen, nooit verruimen.
--
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie CLAUDE.md "Database-schema (Supabase)").

DROP POLICY IF EXISTS "entries_select_eigen_opt_in_of_admin" ON entries;
CREATE POLICY "entries_select_eigen_opt_in_radius_of_admin" ON entries
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR (
      opt_in_buurt = true
      AND entries.gps_lat IS NOT NULL AND entries.gps_lng IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.thuislocatie_lat IS NOT NULL
          AND ur.thuislocatie_lng IS NOT NULL
          AND (
            6371000 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(ur.thuislocatie_lat)) * cos(radians(entries.gps_lat)) *
                cos(radians(entries.gps_lng) - radians(ur.thuislocatie_lng)) +
                sin(radians(ur.thuislocatie_lat)) * sin(radians(entries.gps_lat))
              ))
            )
          ) <= 5000
      )
    )
  );

-- Let op: een lezer zonder ingestelde thuislocatie (thuislocatie_lat/lng
-- NULL in user_roles) ziet hierdoor GEEN gedeelde buurtmeldingen meer van
-- anderen — fail-closed, in lijn met de privacy-insteek van deze policy.

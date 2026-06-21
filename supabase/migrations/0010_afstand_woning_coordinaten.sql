-- Bewaart de coördinaten van de dichtstbijzijnde woning (al wel berekend
-- in het formulier, zie hooks/useNieuweMeldingForm.js, maar voorheen alleen
-- de afstand in meter opgeslagen). Nodig om de woonlocatie als pin te
-- kunnen tonen op de kaartweergave in het PDF-dossier (zie
-- lib/export/meldingKaartAfbeelding.js) — bestaande meldingen hebben deze
-- kolommen NULL, de kaart laat die pin dan gewoon weg.
--
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie CLAUDE.md "Database-schema (Supabase)").

ALTER TABLE entries ADD COLUMN IF NOT EXISTS afstand_woning_lat double precision;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS afstand_woning_lng double precision;

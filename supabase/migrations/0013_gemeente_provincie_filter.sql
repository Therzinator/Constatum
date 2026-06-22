-- Coordinatie & Admin systeem — provincie/gemeente-filter op de
-- Coördinatiepagina (perceel-analyse, melder-overzicht, buurtgebied
-- tekenen, buurtrapport genereren, onder review/shadow). De app sloeg tot
-- nu toe alleen postcode op (zie migratie 0004) — gemeente/provincie komen
-- uit dezelfde PDOK Locatieserver-reverse-lookup (zoekGemeenteProvinciePDOK,
-- lib/pdok/postcode.js), maar zijn een eigen, additieve kolom omdat ze
-- los van postcode ingevuld/gebackfilld worden.
--
-- Geen DEFAULT (zelfde reden als postcode in migratie 0004: bestaande
-- rijen moeten via de admin-backfill-knop aangevuld worden, niet met een
-- placeholderwaarde).
--
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie CLAUDE.md "Database-schema (Supabase)").

ALTER TABLE entries ADD COLUMN IF NOT EXISTS gemeente text;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS provincie text;

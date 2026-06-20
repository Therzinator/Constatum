-- DPIA-afronding: buurt-opt-in en expliciete toestemming gezondheidsgegevens.
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in dit
-- project — zie CLAUDE.md "PDOK/BAG/BRP koppelingen zijn bestaande integraties").

ALTER TABLE entries ADD COLUMN IF NOT EXISTS opt_in_buurt boolean DEFAULT false;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS gezondheid_toestemming boolean DEFAULT false;

-- Voorheen kon iedere ingelogde gebruiker via de client (laadVanSupabase/
-- realtime 'entries-live' channel) ALLE entries van ALLE gebruikers lezen,
-- zonder dat de melder daar toestemming voor gaf. Dit beleid beperkt het
-- op database-niveau (client-side filtering alleen is geen garantie) tot:
-- eigen meldingen, of meldingen waarvan de melder opt_in_buurt = true heeft
-- gezet. Pas dit toe op de bestaande SELECT-policy van de 'entries' tabel
-- (vervang de huidige policy-naam indien afwijkend):
--
-- DROP POLICY IF EXISTS "entries_select_policy" ON entries;
-- CREATE POLICY "entries_select_eigen_of_opt_in" ON entries
--   FOR SELECT USING (
--     auth.uid() = user_id OR opt_in_buurt = true
--   );
--
-- Realtime levert alleen rijen die onder RLS zichtbaar zijn voor de
-- ingelogde gebruiker, dus deze policy beperkt zowel laadVanSupabase()
-- als de buurt-notificaties (useBuurtNotificaties.js) tegelijk.

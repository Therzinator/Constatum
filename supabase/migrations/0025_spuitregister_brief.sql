-- Migratie 0025: Spuitregister opvraagbrief — client-only feature, geen DB-wijzigingen.
-- De brief gebruikt uitsluitend bestaande entries-kolommen:
-- perceelnummer, gemeente, gps, timestamp_local, rfc3161, id, weather.
-- Geen nieuwe tabellen, kolommen of RLS-policies vereist.

SELECT 'Migratie 0025: geen DB-wijzigingen — spuitregisterBrief is client-only' AS status;

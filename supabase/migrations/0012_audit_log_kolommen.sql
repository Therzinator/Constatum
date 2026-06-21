-- "audit_log mislukt: Could not find the '...' column of 'audit_log' in
-- the schema cache" — kwam achtereenvolgens op voor app_version én
-- ip_hint. Zelfde patroon als migratie 0001's gezondheid_toestemming-
-- kolom (zie DECISIONS.md/NEXT_STEPS.md): de audit_log-tabel staat (net
-- als entries/user_roles) in geen enkele migratie getrackt, dus
-- schema-gaten zoals deze waren tot nu toe niet vanuit de code te zien.
--
-- I.p.v. los, kolom-voor-kolom achter elke nieuwe foutmelding aan te
-- lopen: alle kolommen die sbAuditLog() (lib/supabase/auditLog.js)
-- nodig heeft in één keer toevoegen (ADD COLUMN IF NOT EXISTS is
-- veilig op kolommen die al bestaan — die worden overgeslagen).
-- entry_id is text, niet uuid: entries.id is een door de client
-- gegenereerde string (zie generateId() in utils/format.js, bv.
-- "DL-ABC123-XYZ9"), geen Postgres-uuid.
--
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie CLAUDE.md "Database-schema (Supabase)").

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entry_id text;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS detail jsonb DEFAULT '{}'::jsonb;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_hint text;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS app_version text;

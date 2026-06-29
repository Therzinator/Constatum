-- Migratie 0026: CHECK-constraint op user_roles.role
-- Voorkomt silent fails bij typfouten (bv. 'Admin' i.p.v. 'admin').
-- Toegestane waarden gesynchroniseerd met src/lib/rollen.js.
--
-- STAP 1: voer eerst de SELECT uit om te controleren of er ongeldige
-- waarden in de tabel staan — los die op voordat je de constraint toevoegt.
SELECT user_id, role
FROM user_roles
WHERE role NOT IN ('gebruiker', 'admin', 'coordinator');

-- STAP 2: voeg de constraint toe (alleen uitvoeren als STAP 1 geen rijen geeft)
ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('gebruiker', 'admin', 'coordinator'));

-- Migratie 0029: herstel "infinite recursion detected in policy for
-- relation entries_groepen" bij verwijderen als groepbeheerder.
--
-- Root-oorzaak:
--   DELETE entries_groepen
--     → entries_groepen_delete_eigen_melding evalueert
--       EXISTS (SELECT 1 FROM entries WHERE id = entry_id AND user_id = uid())
--     → entries SELECT policy "entries_select_groepslid" evalueert
--       EXISTS (SELECT 1 FROM entries_groepen eg JOIN groep_leden gl ...)
--     → Postgres evalueert entries_groepen SELECT policy opnieuw
--       terwijl die al in evaluatie is → infinite recursion
--
-- Fix: zelfde patroon als fn_is_groepslid (migratie 0018) voor groep_leden.
-- Wrap de entries_groepen + groep_leden join in een SECURITY DEFINER-functie
-- die RLS op entries_groepen omzeilt, zodat de keten niet meer terugloopt.

CREATE OR REPLACE FUNCTION fn_entry_zichtbaar_voor_groepslid(
  p_entry_id text,
  p_user_id  uuid
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM entries_groepen eg
    JOIN groep_leden gl ON gl.groep_id = eg.groep_id
    WHERE eg.entry_id = p_entry_id
      AND gl.user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION fn_entry_zichtbaar_voor_groepslid(text, uuid) TO authenticated;

-- Vervang de entries SELECT policy die entries_groepen direct bevraagde
DROP POLICY IF EXISTS "entries_select_groepslid" ON entries;
CREATE POLICY "entries_select_groepslid" ON entries
  FOR SELECT USING (
    fn_entry_zichtbaar_voor_groepslid(id, auth.uid())
  );

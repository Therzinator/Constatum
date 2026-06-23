-- Feedback verwijderen — een gebruiker mag zijn eigen feedback-item
-- verwijderen, een admin mag elk feedback-item verwijderen (op verzoek,
-- 2026-06-23). Migratie 0017 had hier nog geen DELETE-policy voor, dus
-- zonder deze migratie faalt elke verwijderpoging stil op RLS.
--
-- Handmatig uitvoeren in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie root-CLAUDE.md "Database-schema (Supabase)").

CREATE POLICY "feedback_delete_eigen_of_admin" ON feedback
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Migratie 0024: verwijder legacy triggers die conflicteren met het
-- 4-tier trust-score systeem (migratie 0022).
--
-- trg_nieuwe_melding_review (BEFORE INSERT):
--   Stamt uit de periode vóór het 4-tier systeem. Draait NÁ
--   trg_entries_set_visibility (alfabetische volgorde) en overschrijft
--   de 4-tier logica in twee gevallen:
--     - Score 20-39: should be under_review → wordt shadow (fout)
--     - Score 80+, account < 48u: should be normal → wordt under_review (fout)
--   Volledig overbodig: trg_entries_set_visibility dekt alle gevallen.
--
-- trg_trust_score_check (AFTER INSERT):
--   GPS-proximity variant van fn_entries_misbruikdetectie. Op de 11e
--   melding op hetzelfde GPS-punt vuren BEIDE triggers: -20 + -20 = -40
--   in plaats van -20. Bovendien: > 10 GPS-meldingen is als aanvulling
--   op perceel-spam bruikbaar, maar de cumulatieve straf is onbedoeld.
--   Aanbeveling: laat de perceel-gebaseerde misbruikdetectie leidend
--   zijn; GPS-check verwijderen om dubbele penalisering te voorkomen.

DROP TRIGGER IF EXISTS trg_nieuwe_melding_review ON entries;
DROP FUNCTION IF EXISTS trg_nieuwe_melding_review();

DROP TRIGGER IF EXISTS trg_trust_score_check ON entries;
DROP FUNCTION IF EXISTS trg_trust_score_check();

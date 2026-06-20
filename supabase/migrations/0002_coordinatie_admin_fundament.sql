-- Coordinatie & Admin systeem, Fase 1 — database fundament.
-- Handmatig uitgevoerd in de Supabase SQL-editor (geen migratie-tooling in
-- dit project — zie CLAUDE.md "Database-schema (Supabase)"). Dit bestand
-- legt die uitvoering vast zodat ze reproduceerbaar en review-baar blijft.
--
-- Onderdeel van het 7-fasen "Coordinatie & Admin systeem"-plan (trust
-- score, telefoonverificatie, coordinatietokens, buurtdossiers). Fase 2 t/m
-- 7 (account-verificatie, melder-opt-in/deeltokens, admin-panel,
-- misbruikdetectie, buurtrapport, collectief dossier) zijn nog niet
-- geimplementeerd in de React-app.

ALTER TABLE entries ADD COLUMN IF NOT EXISTS opt_in_buurt boolean DEFAULT false;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'normal'; -- normal/under_review/shadow

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 75,
  ADD COLUMN IF NOT EXISTS telefoon_geverifieerd boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_aangemaakt timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS coordinatie_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  omschrijving text,
  expires_at timestamptz,
  gebruikt boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buurtdossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postcodegebied text,
  aangemaakt_door uuid REFERENCES auth.users(id),
  periode_van date,
  periode_tot date,
  aantal_melders integer,
  aantal_meldingen integer,
  rapport_json jsonb,
  created_at timestamptz DEFAULT now()
);

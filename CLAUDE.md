# Constatum

## Project context
Constatum is een GIS-webapp voor het registreren van bestrijdingsmiddelen-spuitactiviteit 
near residential areas in Nederland. Doel: juridisch bewijsmateriaal genereren voor burgers.

## Technische stack
- Frontend: React (Vite)
- Backend: Supabase
- Cryptografie: SHA-256, RFC 3161, eIDAS
- APIs: PDOK, BRP, BAG

## Regels voor agents
- Raak SHA-256 en RFC 3161 logica NIET aan zonder expliciete bevestiging
- Gebruik Nederlandse namen voor domeinlogica (perceel, spuitdatum, melding, etc.)
- PDOK/BAG/BRP koppelingen zijn bestaande integraties — niet refactoren zonder toestemming
- Sla altijd op in Git voordat je grote wijzigingen maakt

## Startup Procedure

Lees vóór het aanpassen van code altijd eerst:

1. `docs/DOMAIN_KNOWLEDGE.md`
2. `docs/DECISIONS.md`
3. `docs/CURRENT_STATE.md`
4. `docs/NEXT_STEPS.md`

(Let op: `docs/index.html` is de legacy prototype-app, geen documentatie —
niet verwarren met de vier bestanden hierboven.)

## Na belangrijke wijzigingen

Controleer altijd of het volgende bijgewerkt moet worden:

- `docs/DECISIONS.md` — bij een nieuwe architectuur- of productkeuze.
- `docs/CURRENT_STATE.md` — bij een statuswijziging (nieuwe/verwijderde
  functionaliteit, nieuwe beperking).
- `docs/NEXT_STEPS.md` — afgeronde taken verwijderen, nieuwe openstaande
  taken toevoegen.
- `docs/DOMAIN_KNOWLEDGE.md` — alleen bij nieuwe, langdurig relevante
  domeinkennis (niet bij elke taak).

## Database-schema (Supabase)
Er is geen migratie-tooling gekoppeld aan dit project — Supabase-schema wordt
handmatig beheerd via de SQL-editor. Schema-wijzigingen worden wel altijd als
SQL-bestand vastgelegd in `supabase/migrations/NNNN_korte_naam.sql` (oplopend
genummerd), zodat ze reproduceerbaar en review-baar blijven, ook al worden ze
niet automatisch uitgevoerd. Voeg in het bestand een commentaarblok toe met
eventuele bijbehorende RLS-policy-wijzigingen. Voer het bestand zelf uit in de
Supabase SQL-editor — een agent kan dit niet namens je uitvoeren.
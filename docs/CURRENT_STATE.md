# Huidige staat — SpuitLogger

Momentopname. Dit bestand veroudert sneller dan DOMAIN_KNOWLEDGE.md/
DECISIONS.md — bij twijfel altijd verifiëren tegen de code (`git log`,
grep), niet blind vertrouwen op een oude snapshot.

Laatst bijgewerkt: 2026-06-22.

## Technische stack

- **Frontend**: React 19 + Vite 8, geen TypeScript.
- **Backend**: Supabase (Postgres + Auth + Storage), schema handmatig
  beheerd (zie DECISIONS.md).
- **Kaart**: OpenLayers 10 + proj4 (RD New-reprojectie voor PDOK-WFS).
- **Grafieken**: Chart.js.
- **Cryptografie**: SHA-256 + RFC 3161-tijdstempel + eIDAS (freeze-zone,
  zie DECISIONS.md) — voor dossier-PDF's.
- **Externe API's**: PDOK (kadastrale percelen, Natura2000, postcode,
  BAG/woninglocaties), Open-Meteo (live weer), KNMI Open Data EDR
  (gecertificeerd weer), BRP (volgens root-CLAUDE.md aanwezig, niet
  vandaag bekeken).
- **Testen**: ESLint, Playwright (`npm run test:e2e`), `npm run build` als
  rooktest (geen unit-testrunner geconfigureerd in `package.json`).

## Buurtgebied tekenen → export + Dossier-PDF (sinds 2026-06-22)

- **Kaart toont nu meldingen geclusterd** (`BuurtgebiedTekenaar.jsx`,
  zelfde `ol/source/Cluster`-patroon als `DashboardKaart.jsx`, maar
  vereenvoudigd — geen klik-popup/datumlabel, alleen kleur-per-type +
  aantal-badge) — voorheen een lege kaart, je tekende dus "blind". Toont
  de set die CoordinatiePage al doorgeeft (`entriesGefilterd`, dezelfde
  provincie/gemeente-filter als de andere kaarten). Kaarthoogte 240px →
  360px voor betere leesbaarheid van de clustering.
- **Na het tekenen: twee losse knoppen** — "📄 Exporteer meldingen als
  CSV" en "📦 Stel Dossier-PDF samen" zijn bewust gescheiden acties
  (voorheen één knop die altijd eerst de CSV downloadde en daarna de PDF
  opende). Beide filteren ALLE meldingen (volledig admin/coordinator-
  zicht via `haalAlleEntriesVoorExportAdmin()`, **ongeacht `opt_in_buurt`**
  — dit is bewust geen anonieme aggregatie zoals Buurtrapport genereren,
  maar het al bestaande admin-zicht op individuele meldingen) op of ze
  binnen de getekende polygoon liggen (`geometry.intersectsCoordinate()`,
  OpenLayers — geen eigen point-in-polygon-code) via de gedeelde helper
  `haalMeldingenInGebied()` (`BuurtgebiedTekenaar.jsx`, met eigen
  status/bezig-state per knop). De CSV-knop downloadt
  (`meldingenNaarCSV`); de PDF-knop bundelt in het bestaande
  Dossier-PDF-formaat (`genereerDossierHTML`/`openDossierPDF` uit
  `lib/export/pdf.js` — **ongewijzigd hergebruikt**, geen aanpassing aan
  hash/RFC3161-logica). Nieuw bestand `lib/meldingen/regioExport.js`
  (`entryNaarExportMelding()`) zet een ruwe entries-rij om naar dezelfde
  vorm die die PDF/CSV-functies al verwachten — een eigen, kleinere kopie
  van de mapping in `laadVanSupabase()` (entries.js), niet die functie
  zelf aangepast.
- **Onzekerheid, niet vanuit code te verifiëren**: foto's worden per
  melding apart opgehaald via `laadBijlagenVanSupabase()` — of een
  coordinator/admin ook andermans bijlagen mag lezen hangt af van
  RLS-policies op `attachments`/Storage-bucket `spuitlog-bijlagen`, die in
  **geen enkele migratie** staan (zelfde "schema-gat"-patroon als migratie
  0012's audit_log-kolommen). Faalt per melding stilletjes terug naar een
  lege bijlagenlijst (geen harde foutmelding) als dat niet mag — dus de
  PDF/CSV-export zelf werkt altijd, alleen mogelijk zonder foto's van
  andere melders. Checken in de Supabase dashboard of dit gewenst is.

## Provincie/gemeente-filter op Coördinatie (sinds 2026-06-22)

- **Nieuwe kolommen `entries.gemeente`/`entries.provincie`** (migratie
  0013, **uitgevoerd** — bevestigd door de gebruiker op 2026-06-22).
  Historische meldingen moeten nog via de backfill-knop op
  CoordinatiePage aangevuld worden, zie NEXT_STEPS.md. Gevuld via een
  nieuwe, additieve PDOK-functie
  `zoekGemeenteProvinciePDOK()` (`lib/pdok/postcode.js`) — bewust naast
  de bestaande `zoekPostcodePDOK()` gehouden i.p.v. samengevoegd, zie
  CLAUDE.md ("PDOK-koppelingen niet refactoren zonder toestemming").
  Wordt net als postcode ingevuld bij het plaatsen van de meldingspin
  (`useNieuweMeldingForm.js`) en heeft een eigen admin-backfill-knop op
  CoordinatiePage voor historische meldingen.
- **Filter op CoordinatiePage** (`provincies()`/`gemeentenInProvincie()`/
  `filterOpRegio()` in `lib/meldingen/coordinatieStatistieken.js`) — een
  provincie+gemeente-dropdown filtert Perceel-analyse, Windroos,
  Melder-overzicht en Onder review/shadow. Opt-in-melders-per-postcode en
  Trust-score-verdeling blijven bewust ongefilterd (niet gevraagd).
  Buurtgebied tekenen wordt bij het **eerste** openen van die kaart
  gecentreerd op het gemiddelde GPS-punt van de gefilterde meldingen (de
  kaart mount-eenmalig, zie `BuurtgebiedTekenaar.jsx` — een filter-wissel
  ná het tekenen verplaatst de kaart niet meer, bewust niet aangepast).
  Buurtrapport genereren krijgt het meest voorkomende postcodegebied
  binnen het filter voorgevuld (werkt zelf nog op postcode, niet op
  gemeente).
- Meldingen van vóór deze migratie/backfill missen gemeente/provincie en
  vallen buiten elk filter (blijven wel zichtbaar als er niet gefilterd
  wordt).

## Trust-score — ontwerp voor automatische op-/afschaling (voorstel, 2026-06-22, NIET geïmplementeerd)

Besproken maar bewust **niet gebouwd** — gebruiker wilde eerst het
ontwerp zien. Zie ook NEXT_STEPS.md.

- **Huidige situatie**: `user_profiles.trust_score` (0-100, default 75)
  wordt nu alleen automatisch *verlaagd* (migratie 0005: -20 bij >10
  meldingen/perceel/24u, -15 bij herhaalde identieke beschrijving) en
  alleen handmatig *verhoogd* door een coordinator (CoordinatiePage,
  los invoerveld). Geen automatische positieve bijstelling.
- **Voorstel positieve signalen**: (a) periodieke "betrouwbaarheids-
  bonus" voor accounts ouder dan 90 dagen zonder enige
  under_review/shadow-vlag in die periode; (b) een iets grotere bonus
  wanneer een coordinator een melding expliciet goedkeurt (bestaande
  "✓ Goedkeuren"-knop) i.p.v. alleen visibility te wijzigen zonder
  score-effect.
- **Voorstel aanvullende negatieve signalen**: een melding die een
  coordinator handmatig naar `shadow` zet (nu zonder score-effect) zou
  een grotere score-straf moeten geven dan automatische detectie, omdat
  een mens het beoordeeld heeft.
- **Voorgestelde categorieën en het verschil per categorie**:
  - **80-100 "Vertrouwd"**: meldingen altijd direct normaal zichtbaar,
    telt zwaarder mee in de bewijswaardescore van buurtrapporten.
  - **40-79 "Standaard"** (huidige default 75 valt hierin): huidig
    gedrag — alleen nieuwe accounts (<48u) of veel meldingen in de
    eerste week gaan naar `under_review`.
  - **20-39 "Verhoogd toezicht"** (nieuw, tussenliggend): elke nieuwe
    melding gaat naar `under_review` tot een coordinator goedkeurt,
    i.p.v. pas bij account-leeftijd/-volume.
  - **0-19 "Geschaduwd"**: meldingen direct `shadow` (huidige drempel
    ligt op <40 — voorstel is die te verlagen naar <20 zodat 20-39 als
    eigen tussencategorie kan dienen), uitgesloten van buurtrapporten.
  - Dit raakt `fn_entries_set_visibility()`/`fn_entries_misbruikdetectie()`
    (migratie 0003/0005) en zou een nieuwe migratie 0014 vereisen —
    expliciete bevestiging nodig vóór bouw.

## Buren uitnodigen (sinds 2026-06-22)

- **Eigen pagina i.p.v. dashboard-kaart**: `DeeltokenGenerator.jsx`
  (`src/components/notificaties/`) is verplaatst van `DashboardPage.jsx`
  naar een nieuwe `UitnodigenPage.jsx`, bereikbaar via een eigen
  navigatieknop (person+plus-icoon) naast de instellingenknop in
  `AppHeader.jsx`.
- **Geldigheid 24 uur i.p.v. 14 dagen** (`lib/supabase/deeltokens.js`,
  `GELDIGHEID_UUR`) — de link werkt na 24 uur niet meer.
- **Omschrijving is nu een auto-gegenereerde 8-tekens code** (letters+
  cijfers, zonder 0/O/1/I) i.p.v. vrije tekst — de gebruiker typt niets
  meer in, `maakDeeltoken(user)` genereert de code zelf.
- **Standaardtekst bij kopiëren**: "Doe mee met de buurt en registreer
  spuitactiviteiten!" wordt samen met de link naar het klembord gekopieerd.
- **Lijst toont resterende uren** i.p.v. open/verlopen-status, en tokens
  die meer dan 48 uur verlopen zijn worden niet meer opgehaald
  (`haalEigenDeeltokens`, `VERBERG_NA_UUR_VERLOPEN`) — blijven wel in de
  database staan, verdwijnen alleen uit het overzicht.

## Privacybescherming melders: notificaties verwijderd + 30 min vertraging (sinds 2026-06-22)

- **Buurt-notificatiefunctie volledig verwijderd** (`useBuurtNotificaties.js`,
  `NotificatieBanner.jsx`/`.css`, `NotificatieInstellingen.jsx` — geen van
  alle bestaan nog). Geen browser-`Notification` of in-app banner meer bij
  een nieuwe gedeelde melding van een ander. Zie DECISIONS.md voor de
  reden (identiteitsbescherming melders tegen een mogelijk
  geïnfiltreerde teler in de buurt-groep).
- **Bereik-instelling (1/2,5/5 km) blijft bestaan**, los van de
  verwijderde notificaties — regelt hoe ver andermans gedeelde meldingen
  op Dashboard en Tijdlijn zichtbaar zijn. Verplaatst van de (verwijderde)
  `NotificatieInstellingen`-toggle naar een eigen "📍 Bereik
  buurtmeldingen"-select in het account-menu (`AccountMenu.jsx`), altijd
  zichtbaar i.p.v. alleen als notificaties aanstonden.
  `lib/notificaties/buurtMelding.js` heet nog steeds zo (niet hernoemd),
  exporteert nu `laadBereikMeter()`/`slaBereikMeterOp()` i.p.v. de oude
  notificatie-instellingen-paar.
- **Andermans gedeelde meldingen (`opt_in_buurt`) pas zichtbaar 30 minuten
  na het melden** — `magAndermansMeldingTonen()`
  (`lib/meldingen/buurtVertraging.js`), gebaseerd op `entries.created_at`
  (server-tijdstip, niet het vrij invoerbare `timestamp_local`). Geldt op
  Dashboard (`DashboardPage.jsx` → `meldingenInBereik`, dus ook de kaart en
  "Recente meldingen") én Tijdlijn (`TijdlijnPage.jsx` →
  "Gedeelde meldingen in jouw buurt"-filter). Eigen meldingen blijven voor
  de melder zelf altijd direct zichtbaar. Geldt **niet** voor het
  admin/coordinator-zicht (CoordinatiePage, buurtgebied-export,
  buurtrapport) — dat is al een vertrouwde rol, bewust ongewijzigd.
- `entries.js`'s `laadVanSupabase()`-mapping zet nu ook `created_at` door
  naar het lokale melding-object (stond er voorheen niet expliciet in,
  alleen indirect via `sync_at`) — nodig als betrouwbare bron voor de
  vertraging.

## "Recente meldingen" opmaak + mini-kaartje privacy (sinds 2026-06-22)

- **Mini-kaartje (`MeldingMiniKaart.jsx`) toont een effen gekleurde stip**
  i.p.v. een geroteerd type-emoji-icoon — bij 26px was de tegengedraaide
  emoji onduidelijk leesbaar; het type staat al in de badge erboven. Kleur
  komt uit `TYPE_KLEUR` in `MeldingCard.jsx` (dezelfde kleuren als de
  kaart-markers op Dashboard/Buurtgebied tekenen, los gehouden van die
  bestanden — geen gedeelde module, bewuste duplicatie zoals daar al
  bestond tussen `DashboardKaart.jsx`/`BuurtgebiedTekenaar.jsx`).
- **Mini-kaartje (exacte locatie-pin) alleen nog bij eigen meldingen** —
  voor andermans gedeelde melding (`opt_in_buurt`) is een exacte pin op
  een kaartje zelf een herleidbaarheidsrisico, hetzelfde dreigingsmodel als
  de 30-minuten-vertraging (zie hierboven): een teler zou een melder
  alsnog tot op de meter kunnen lokaliseren. De losse afstandTekst
  ("Melding X meter vanaf jouw positie") blijft wel zichtbaar bij
  andermans melding — dat is alleen een getal, geen kaart.
- **Compacte kaart ("Recente meldingen") toont relatieve tijd** ("12 min
  geleden" / "3 u geleden" / "2d geleden") i.p.v. de volledige datum/tijd,
  valt terug op de volledige datum na een week (`relatieveTijd()` in
  MeldingCard.jsx). Melding-ID, bestandsaantal en melder-code zijn uit de
  compacte rij gehaald (stonden te dicht op elkaar, lage waarde op dit
  niveau — wel nog in de detail-modal/niet-compacte Tijdlijn-kaart). Een
  gezondheidsklacht is verplaatst naar een eigen badge naast het type
  (rij 1) i.p.v. tussen de overige meta-iconen, als enige signaal dat in
  dit overzicht mag opvallen.

## Bestaande modules

- **Dashboard** (`components/dashboard/`) — statistieken, kaart met
  meldingmarkers/clustering/driftzones/Natura2000/percelen/Heatmap,
  maandgrafiek, recente meldingen.
- **Melding** (`components/melding/`) — formulier voor nieuwe meldingen,
  met eigen locatiekaart (pin plaatsen, GPS, percelen altijd zichtbaar,
  windvector-animatie, meetlint).
- **Tijdlijn** (`components/meldingen/`) — lijst/cluster-weergave van
  eigen + gedeelde meldingen.
- **Export** (`components/export/`) — PDF-dossier, CSV, KNMI-instellingen,
  Prullenbak (admin-only herstel).
- **Instellingen** (`components/instellingen/`) — GPS-voorkeur, bereik,
  thuislocatie, privacy/onderzoek-opt-out, account.
- **Coördinatie** (`components/coordinatie/`) — admin/coordinator-panel:
  alle meldingen/profielen, moderatie (zichtbaarheid), trust-score,
  postcode-backfill, buurtrapport-generator, buurtgebied-tekenaar.
  **`role==='admin'` of `'coordinator'`** (App.jsx/BottomNav.jsx + RLS-
  migratie 0011 — **bijgewerkt 2026-06-21**, was eerst admin-only).
- **Auth/Onboarding** — login/signup, handleiding, privacyverklaring,
  algemene voorwaarden.

## Actieve functionaliteit (kaart-specifiek, vaak verward)

- Dashboard: luchtfoto-toggle, driftzone-toggle, Natura2000-toggle
  (+infopopup bij klik), percelen-toggle (+infopopup bij klik — **nieuw
  2026-06-21**), Heatmap-toggle (**alleen `admin`/`coordinator`**,
  **nieuw 2026-06-21**), maand/jaar/dag-filter, live GPS-pin. Toont een
  zichtbare melding ("X van Y getoond") als het 100-meldingen-plafond
  geraakt wordt i.p.v. stilzwijgend af te kappen (**nieuw 2026-06-21**).
- Melding: percelenlaag **altijd aan** (geen toggle, **bug gefixt
  2026-06-21** — de laag werd nooit zichtbaar gezet), windvector-animatie
  bij geplaatste pin, meetlint vanaf eigen GPS-positie.
- Coördinatie: **windroos per perceel** (**nieuw 2026-06-21**,
  `lib/meldingen/statistieken.js` → `windrichtingPerPerceel()`) — toont per
  perceel de dominante windrichting + percentage, vanaf 3 meldingen met
  winddata.

## Recent verwijderd

- **Neerslagradar / "Hotspots" was géén verwijdering, wel gating**: let
  op het onderscheid — Neerslagradar (Buienradar-gebaseerd: radarbeelden,
  neerslagverwachting, spuitvenster-indicatie) is op 2026-06-21 **volledig
  verwijderd** uit de Dashboard-kaart, inclusief de bestanden
  `lib/weather/radarLaag.js`, `weerbericht.js`, `spuitvenster.js`. De
  Heatmap ("Hotspots") bestaat nog steeds, maar is nu rol-gated i.p.v.
  voor iedereen zichtbaar.
- Zie DECISIONS.md voor de waarom; dit is bewust, niet per ongeluk
  weggevallen — niet teruglezen uit git-historie en automatisch
  terugzetten.

## Performance (sinds 2026-06-21)

- **Code-splitting**: `DashboardKaart.jsx`, `LocatieKaart.jsx`,
  `MeldingDetailModal.jsx` (incl. `DriftZoneKaart` erin) en
  `BuurtgebiedTekenaar.jsx` zijn `React.lazy()`-geladen, plus een dynamic
  import van `meldingKaartAfbeelding.js` binnen `lib/export/pdf.js`.
  Hoofdbundel: 1.377 MB → ~751 KB (gzip 414 KB → 228 KB). OpenLayers zit nu
  in losse, on-demand chunks (`lagen-*.js` ~318KB, `perceelLaag-*.js`
  ~136KB, `DashboardKaart-*.js` ~113KB, etc.) i.p.v. in de hoofdbundel.
  `MeldingenLijst.jsx` is dead code (nergens geïmporteerd) — niet
  meegenomen in de lazy-load-ronde, niet verwijderd (buiten scope).
- **Realtime-subscriptie weer ongefilterd** (`useSupabaseSync.js`): een
  poging om dit te filteren (user_id/opt_in_buurt) veroorzaakte bij de
  eerste echte login een oneindige reconnect-lus en bevroor de app —
  **teruggedraaid op 2026-06-21**, zie NEXT_STEPS.md.
- **Reconnect-sync**: `window.addEventListener('online', syncNu)`
  toegevoegd — de offline-queue wordt nu automatisch verwerkt zodra de
  verbinding teruggekomt, niet pas bij de volgende handmatige actie.
- **Gedeelde PDOK-WFS-client**: `lib/pdok/wfsClient.js` (bbox-opbouw +
  fetch/validatie) — `perceel.js`/`perceelLaag.js`/`natura2000.js`/
  `natura2000Laag.js` bouwen er nu op voort i.p.v. elk een eigen
  fetch-implementatie. Bewust geen OpenLayers-import in `wfsClient.js`
  zelf (zou de hoofdbundel weer vergroten via `perceel.js`/`natura2000.js`,
  die niet lazy-geladen zijn).

## Database-migraties

Alle migraties **0001 t/m 0011 zijn uitgevoerd** (bevestigd door de
gebruiker op 2026-06-21, geen foutmeldingen) — inclusief de 5km-
privacygrens (0009) en de coordinator-RLS (0011). Nieuwe migraties na
0011 toevoegen op nummer 0012.

## Dossier/bewijskracht (sinds 2026-06-21)

- **PDF-dossier toont nu de volledige EXIF/GPS-gestripte foto** i.p.v. de
  extra-gecomprimeerde thumbnail (`lib/export/pdf.js`) — de volledige
  versie stond al in IndexedDB (`idbSaveBijlage`), maar werd voorheen
  altijd overschaduwd door `f.thumbnail` in de prioriteitsvolgorde.
- **Per-foto SHA-256-hash van het ORIGINEEL nu zichtbaar in het dossier**
  (was al berekend en opgeslagen, stond nergens getoond) — met een
  toelichtende tekst dat de hash bovenaan de sectie de meldinggegevens
  (metadata) verifieert, niet de foto's. Geen nieuwe hash-berekening, geen
  wijziging aan SHA-256/RFC3161-logica zelf (freeze-zone gerespecteerd) —
  alleen bestaande waarden eerlijker tonen/labelen.

## Bekende beperkingen / inconsistenties

- **`coordinator`-rol dekt niet alles wat `admin` dekt** — bewust: geen
  toegang tot account-verwijdering (migratie 0008-policy) en geen
  Prullenbak-herstel (InstellingenPage/PrullenbakCard, blijft
  `isAdmin()`-only). Dit is per ontwerp, niet per ongeluk — zie
  DECISIONS.md voor de afgebakende scope.
- **Geen db-enum/CHECK-constraint op `user_roles.role`**: een typo in de
  database (bv. `'Admin'` met hoofdletter) faalt stil terug naar
  `'gebruiker'`-gedrag, zonder foutmelding.
- **`docs/` is geen documentatiemap**: het is de legacy single-file
  HTML-prototype (`docs/index.html`, 7500+ regels) waarnaar veel
  code-comments verwijzen ("Komt overeen met ... uit docs/index.html").
  Dit geheugensysteem staat ernaast in dezelfde map als losse
  `.md`-bestanden — verwar dit niet met "de documentatie van de oude app".

## Belangrijke bestanden en mappen

- `src/components/dashboard/DashboardKaart.jsx` — Dashboard-kaart, alle
  laag-toggles, popup-logica (Natura2000 + percelen).
- `src/components/melding/LocatieKaart.jsx` — Melding-pagina kaart.
- `src/lib/pdok/` — PDOK-integraties (percelen, Natura2000, postcode, BAG).
- `src/lib/weather/` — Open-Meteo (`openMeteo.js`), KNMI
  (`knmi.js`), Pasquill-klasse (`pasquill.js`). Geen Buienradar/radar meer.
- `src/lib/rollen.js` — enige plek waar rolcontroles (`isAdmin`,
  `isCoordinatorOfAdmin`) gedefinieerd staan — nieuwe rolcontroles hier
  toevoegen, niet inline in componenten.
- `src/lib/drift/` — driftberekening + driftzone-laag (windafhankelijk).
- `src/hooks/useAuth.js` — laadt `gebruikerRol` uit `user_roles.role`,
  default `'gebruiker'`.
- `supabase/migrations/` — chronologisch schema-log (handmatig uitvoeren,
  zie root-CLAUDE.md).
- `docs/index.html` — legacy prototype, referentie-implementatie voor
  "hoe deed de oude app dit" (zie comments in src/).

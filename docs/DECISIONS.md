# Beslissingen — SpuitLogger

Architectuur- en productbeslissingen, met de reden erbij. Geen taken hier
(zie NEXT_STEPS.md). Nieuwe beslissing toevoegen onderaan, oudste boven.

---

## OpenLayers als kaart-engine (niet Leaflet, niet MapLibre)

### Keuze
OpenLayers 10 (`ol` package) + `proj4` voor RD New (EPSG:28992)-reprojectie.

### Waarom
De oorspronkelijke prototype (`docs/index.html`) gebruikte Leaflet. Bij de
migratie naar React (commit `4abad98`) is overgestapt naar OpenLayers,
omdat dat WFS-laagondersteuning, clustering, heatmaps en CRS-reprojectie
(nodig voor PDOK-kadastrale-kaart, die in RD New levert) ingebouwd biedt
zonder externe plugins. MapLibre is niet overwogen in de geregistreerde
geschiedenis.

### Impact
Alle kaartcomponenten (`DashboardKaart.jsx`, `LocatieKaart.jsx`,
`MeldingMiniKaart.jsx`) en alle `lib/pdok/*Laag.js`/`lib/drift/*Laag.js`-
bestanden zijn OpenLayers-specifiek. Een toekomstige kaart-engine-wissel
raakt al deze bestanden.

---

## Weerdata gesplitst over drie bronnen, niet één gedeelde integratie

### Keuze
Open-Meteo (live, bij melding-invoer) + KNMI Open Data EDR (gecertificeerd,
op aanvraag met API-key) blijven gescheiden bronnen voor gescheiden
doelen.

### Waarom
Open-Meteo heeft geen key nodig en is snel genoeg voor live invoer, maar
is niet "officieel"/gecertificeerd genoeg voor een juridisch dossier.
KNMI Open Data is dat wel, maar vereist een door de gebruiker zelf
aangevraagde API-key en is te traag/zwaar voor live invoer. Vandaar twee
aparte modules in plaats van één met fallback.

### Impact
`lib/weather/openMeteo.js` en `lib/weather/knmi.js` blijven losse,
onafhankelijke modules. Een wijziging aan de ene mag de andere niet raken.

---

## Buienradar voor de Dashboard-"Neerslagradar" — en later: volledige verwijdering

### Keuze
Eerst (commit `04a09fc`, `4f1f2a7`): RainViewer-radarbeelden vervangen door
Buienradar's gratis raintext/feed-API, omdat RainViewer's gratis tier
sinds 1 januari 2026 geen nowcast meer levert en een lager max-zoomniveau
kreeg. Later, **op 2026-06-21**: de hele Neerslagradar-functionaliteit
(radaranimatie, neerslagverwachting, spuitvenster-indicatie) is op
expliciet verzoek van de gebruiker **volledig verwijderd** uit de app.

### Waarom
Eerste keuze: technische beperking van de gratis RainViewer-tier.
Verwijdering: productbeslissing van de gebruiker (niet technisch
gemotiveerd) — geen vervanging gepland op het moment van verwijderen.

### Impact
`lib/weather/radarLaag.js`, `weerbericht.js`, `spuitvenster.js` zijn
verwijderd. `lib/weather/pasquill.js` bleef bestaan (nog in gebruik door
de live spuitrichtlijn-beoordeling). Als neerslagradar ooit terugkomt: dit
is een **bewust verwijderde** feature, geen vergeten/kapotte code — niet
zomaar terugzetten vanuit git-historie zonder de gebruiker te vragen of
de wens nog steeds geldt.

---

## Supabase als backend, schema handmatig beheerd

### Keuze
Supabase (Postgres + Auth + Storage), zonder gekoppelde migratie-tooling.
Schema-wijzigingen worden wel als SQL-bestand vastgelegd in
`supabase/migrations/NNNN_korte_naam.sql`, maar handmatig uitgevoerd in de
Supabase SQL-editor — een agent voert dit nooit zelf uit.

### Waarom
Vastgelegd in root-CLAUDE.md; geen aanvullende reden in de geschiedenis
gevonden. Waarschijnlijk: kleinschalig project, voorkeur voor handmatige
controle over schema-wijzigingen i.p.v. geautomatiseerde rollouts.

### Impact
Geen enkele agent-actie mag een SQL-migratie automatisch uitvoeren. Elke
schema-wijziging = nieuw genummerd bestand + de gebruiker voert het zelf
uit. Er is geen canonieke `CREATE TABLE`-definitie van `user_roles` in de
migraties terug te vinden (die tabel bestond al vóór migratie 0001) — het
rolmodel is dus alleen af te leiden uit code-gebruik, niet uit schema.

---

## Pseudonieme weergave van meldingen bij delen

### Keuze
Bij gedeelde/buurt-meldingen wordt nooit het e-mailadres van de melder
getoond, alleen een deterministische `Melder#XXXXXX`-code
(`melderCode()` in `src/utils/format.js`).

### Waarom
Privacybescherming van de melder richting omwonenden/derden — voorkomt dat
een melder identificeerbaar wordt voor de partij waarover gemeld wordt.

### Impact
Elke UI die meldingen van *anderen* toont (Dashboard-kaart-legenda,
clustermarkers, Tijdlijn-buurtfilter) moet `melderCode()` gebruiken, nooit
het ruwe e-mailadres. Admins zien via een aparte RLS-bypass wel volledige
gegevens (zie migratie 0004).

---

## Hard 5 km-maximum op zichtbaarheid van gedeelde buurtmeldingen

### Keuze
Een lezer ziet nooit een `opt_in_buurt`-melding van iemand anders die
verder dan 5 km van de eigen thuislocatie ligt — afgedwongen op
database-niveau (RLS-policy, migratie 0009), niet alleen client-side.

### Waarom
Bug/privacylek: vóór migratie 0009 kon een teler die zelf een account
aanmaakt landelijk meekijken met alle gedeelde meldingen, puur door de
boolean `opt_in_buurt` te checken zonder afstandsgrens. De
client-instelling (Instellingen → Bereik, 1–5 km) kan deze 5 km-grens
alleen vernauwen, nooit verruimen.

### Impact
Een lezer zonder ingestelde thuislocatie ziet **geen** gedeelde
buurtmeldingen van anderen (fail-closed). Elke toekomstige
"deel met de buurt"-functionaliteit moet tegen deze policy aanlopen, niet
er omheen werken via een nieuwe client-only-filter.

---

## SHA-256/RFC 3161/eIDAS-logica is een freeze-zone

### Keuze
Geen agent wijzigt cryptografische/tijdstempel-logica zonder expliciete
bevestiging van de gebruiker (root-CLAUDE.md, regel 1).

### Waarom
Dit is de juridische kern van het dossier-bewijs — een onbedoelde
wijziging kan de bewijswaarde van bestaande/toekomstige dossiers
ondermijnen. Validatie hiervan vereist domeinkennis (eIDAS-conformiteit)
die niet door code-inspectie alleen te garanderen is.

### Impact
Elke taak die per ongeluk dicht bij `lib/export/pdf.js`,
tijdstempel-/hash-gerelateerde code komt: eerst expliciet navragen, niet
"meeliftend" aanpassen als onderdeel van een andere taak.

---

## Rol `coordinator` — moderator-achtige rol, uitgebreid naar CoördinatiePage + RLS

### Keuze
`isCoordinatorOfAdmin()` (`src/lib/rollen.js`) behandelt `'coordinator'`
gelijk aan `'admin'` voor: de Heatmap-toggle (Dashboard), de
"Coördinatie"-tab (BottomNav.jsx/App.jsx), én de onderliggende RLS-
policies (migratie 0011) voor entries (select+update), user_profiles
(select+update) en buurtdossiers. **Niet** uitgebreid naar: de
user_profiles DELETE-policy (account verwijderen, migratie 0008) en de
Prullenbak-herstelfunctie (InstellingenPage/PrullenbakCard) — die blijven
`'admin'`-only.

### Waarom
Eerste stap (2026-06-21, ochtend): "Hotspots... moet alleen zichtbaar
zijn voor coordinators en admins" — alleen de Heatmap-toggle gegated,
bewust niet doorgetrokken naar de rest, om geen ongevraagde
toegangswijziging te maken.
Tweede stap (2026-06-21, later): expliciet gevraagd om coordinator als
volwaardige "moderator-achtige rol op het platform" te maken. Scope is
samen met de gebruiker afgebakend: bekijken + zichtbaarheid modereren,
trust-score aanpassen, en datakwaliteit/rapportage-tools wél; Prullenbak-
herstel (destructiever, en zit niet eens op CoördinatiePage maar op
Instellingen) bewust niet.

### Impact
Een coordinator kan nu alles op CoördinatiePage wat een admin ook kan,
behalve geen toegang tot account-verwijdering (die endpoint wordt vanuit
CoördinatiePage toch niet aangeroepen) en geen Prullenbak-herstel. Nieuwe
admin-only functionaliteit die ooit aan CoördinatiePage wordt toegevoegd,
moet bewust gecontroleerd worden of die wel/niet ook voor coordinator mag
— niet automatisch meeliften omdat de pagina al openstaat.

---

## Dossier-hash/foto-mismatch: gelabeld, niet "opgelost" met een nieuwe hash

### Keuze
Het PDF-dossier (`lib/export/pdf.js`) toonde één SHA-256-hash per melding
naast de foto's, wat de indruk kon wekken dat die hash de foto verifieert.
In werkelijkheid is het een hash van de meldinggegevens (metadata), niet
van een foto. Losstaand bestond er al wél een per-foto SHA-256-hash van
het ORIGINEEL geüploade bestand (`f.hash`, berekend in
`useNieuweMeldingForm.js` vóór EXIF-stripping) — die werd nergens getoond.
Gekozen oplossing: (1) de bestaande per-foto-hash nu wél tonen, met een
duidelijk label dat hij bij het origineel hoort, vóór EXIF/GPS-verwijdering;
(2) de metadata-hash een preciezer label geven ("meldinggegevens" i.p.v.
ongespecificeerd "SHA-256 hash"); (3) de getoonde foto zelf is nu de
volledige EXIF-gestripte versie (die al in IndexedDB stond) i.p.v. de
extra-gecomprimeerde thumbnail, zodat de afbeelding tenminste de "echte"
opgeslagen versie is.

### Waarom
Root-CLAUDE.md verbiedt het aanraken van SHA-256/RFC3161-logica zonder
expliciete bevestiging. Een nieuwe hash toevoegen (bv. een hash van de
EXIF-gestripte versie, om een byte-identieke match met de getoonde foto te
forceren) zou nieuwe cryptografische logica zijn — bewust niet gedaan
zonder die bevestiging. De gekozen aanpak verandert geen enkele
hash-/tijdstempel-berekening, alleen welke (al bestaande) waarden getoond
worden en hoe ze gelabeld zijn — een eerlijkheids-/transparantiefix, geen
cryptografiewijziging.

### Impact
De dossier-export claimt niet langer impliciet een foto-verificatie die
hij niet kan onderbouwen. Een melder die het ORIGINELE bestand nog heeft
(bv. op de telefoon) kan dat zelf hashen en vergelijken met de per-foto-
hash in het dossier — dat werkt nu pas, omdat die hash nu zichtbaar is.
Een toekomstige sessie die alsnog een hash-van-de-dossierversie wil
toevoegen (voor een directe byte-match met de getoonde afbeelding) moet
dat expliciet met de gebruiker bespreken — dat raakt wél nieuwe
crypto-logica.

---

## App bevroor bij eerste echte login — echte oorzaak was een useAuth.js-bug, niet de Realtime-filter

### Keuze
Bij de eerste keer dat de gebruiker echt inlogde met Supabase-gegevens
(in plaats van de altijd-uitgeschakelde localhost-auth), bevroor de app
met een console vol herhaalde `[Realtime] Status: CLOSED`-regels. Eerste
diagnose: de op 2026-06-21 toegevoegde `filter`-optie op de
postgres_changes-listener in `useSupabaseSync.js` werd verondersteld
door Supabase geweigerd te worden, in een reconnect-lus — teruggedraaid
naar een ongefilterde listener. De freeze bleef echter bestaan, wat
toonde dat die eerste diagnose onvolledig was.

De echte oorzaak: `useAuth.js`'s `laadGebruikerRol` had een `|| user`-
fallback met `[user]` als dependency. `onAuthStateChange` roept
`setUser()` aan bij ÉLK auth-event (ook stille token-refreshes), met
elke keer een nieuwe object-referentie. Omdat de authInit-`useEffect`
(die `onAuthStateChange` abonneert) depend op `[laadGebruikerRol]`, en
`laadGebruikerRol` dus bij elke `setUser()`-aanroep een nieuwe identiteit
kreeg, voerde die effect zichzelf opnieuw uit: oude listener afmelden,
nieuwe aanmelden — wat zelf weer een event en dus weer `setUser()` kon
triggeren. Oneindige lus. De Realtime-`CLOSED`-spam was een symptoom:
`useSupabaseSync.js`'s eigen effect depend rechtstreeks op `user`, dus
die werd in dezelfde lus telkens mee afgebroken en herstart.

Fix: `laadGebruikerRol` verliest de `|| user`-fallback en de
`[user]`-dependency (elke aanroeper geeft de user al expliciet door) —
nu stabiel (`[]`), dus de authInit-effect draait nog maar één keer.

### Waarom
Dit bleef tot nu onopgemerkt omdat `useAuth.js`'s `onAuthStateChange`-pad
nooit echt liep: lokaal staat `SUPABASE_ENABLED` altijd op `false` (zie
`lib/supabase/client.js`), dus deze code is pas voor het eerst tegen een
echte, ingelogde sessie getest tijdens deze freeze.

### Impact
Een algemene les voor dit project: **elke `useCallback`/`useEffect`-
dependency die een Supabase-auth-gerelateerde waarde gebruikt, moet
expliciet beoordeeld worden op "kan dit veranderen door een event
waar de gebruiker niets van merkt (token-refresh, etc.)?"** — zo'n
verandering die een dependency-keten raakt is precies het patroon dat
hier tot een oneindige lus leidde. Toekomstige wijzigingen aan
`useAuth.js`/`useSupabaseSync.js` kunnen het beste tegen een echte
Supabase-sessie getest worden, niet (alleen) op localhost.

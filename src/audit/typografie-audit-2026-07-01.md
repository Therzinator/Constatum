# Typografie Audit — Mobiele Leesbaarheid
Datum: 2026-07-01
Gebaseerd op: WCAG 2.1 AA, Apple HIG, Material Design 3, NNG-richtlijnen
Scope: `src/` (React/Vite-app) — `docs/index.html` (legacy prototype) is buiten scope.
SHA-256/RFC 3161-logica, PDOK/BAG-koppelingen en Supabase-schema zijn **niet** aangeraakt.

> **Fase 1 (dit rapport)**: inventarisatie + analyse. Geen code gewijzigd.
> **Fase 2**: pas na expliciete bevestiging worden fixes doorgevoerd (zie einde rapport).

---

## Samenvatting

- Root `<html>` heeft geen expliciete `font-size` override → 1rem = 16px (browserstandaard), gebruikt als basis voor alle onderstaande px-berekeningen.
- Er bestaat **geen enkel bestaand `--font-size-*`-designtoken** — alle 235 gevonden declaraties zijn hardcoded (`rem`, een klein aantal `px`).
- Totaal gevonden font-size-declaraties: **235** (186 in CSS-bestanden, 49 als inline `fontSize` in JSX)
- 🔴 Kritiek (< 14px): **~186** (≈79%)
- 🟡 Aandacht (14–15px): **~12**
- 🟢 Voldoende (≥ 16px): **~37**
- Contrastproblemen: **5** kleurcombinaties (1 tekstkleur, 4 badge-achtergronden)

Cijfers zijn een handmatige classificatie van alle gevonden declaraties (zie bijlage voor volledige CSS-grep-tabel) — kleine afrondingsverschillen zijn mogelijk, de orde van grootte (bijna 4 op de 5 tekstgroottes onder 14px) staat vast.

⚠️ **Belangrijke correctie op de in de opdracht aangenomen kleuren**: `--accent` in `src/styles/theme.css` is momenteel **`#04e6d9`** (cyaan, "exact de kleur van het lijnwerk in het logo"), niet `#8bc34a` (nylon-groen) zoals in de opdracht en in `docs/CURRENT_STATE.md` (sectie "Navigatie/thema-herontwerp") staat vermeld. Dat document is op dit punt inmiddels achterhaald door een latere, niet-gedocumenteerde wijziging in de code. `--text-primary` is `#e8edf5` (opdracht noemde `#e2e8f0`). Alle contrastberekeningen hieronder gebruiken de **actuele** waarden uit `theme.css`.

---

## Kritieke bevindingen 🔴

### 1. Formulierlabels in het meldingsformulier — de belangrijkste use case van de app
`MeldingForm.jsx` gebruikt overal de gedeelde class **`.section-label`** (`src/styles/theme.css:78-84`) als daadwerkelijk formulierlabel: "Locatie", "Kadastraal perceelnummer", "Omschrijving & notities *", "Geurintensiteit", "Wind subjectief ervaren", "Gezondheidsklachten registratie", "🤝 Delen", "Foto's/video's", en alle weerdata-labels (Wind, Windrichting, Temperatuur, etc.).

| Bestand | Selector | Huidige waarde | px | Probleem | Aanbeveling |
|---|---|---|---|---|---|
| `styles/theme.css:80` | `.section-label` | `0.65rem` | **10.4px** | Ver onder elke norm (WCAG 16px, Apple HIG min. 11px, NNG "altijd problematisch" < 12px) — dit zijn primaire labels, geen bijschriften, en juist bedoeld voor buiten-gebruik onder tijdsdruk. Extra verzwarend: `text-transform: uppercase` + `letter-spacing: 0.05em`, wat op deze grootte de leesbaarheid verder verlaagt. | Verhogen naar minimaal `--font-size-sm` (14px), bij voorkeur `--font-size-base` (16px) omdat dit een formulierlabel is, geen metadata. |

Dit is de meest impactvolle bevinding van de audit: de bewoner die buiten, met één hand, een melding aanmaakt leest de veldlabels op 10.4px.

### 2. Foutmeldingen (Toast) onder de 12px-grens
| Bestand | Selector | Waarde | px |
|---|---|---|---|
| `components/ui/Toast.css:12` | `.toast` (incl. `.toast.error`) | `0.7rem` | **11.2px** |
| `components/melding/MeldingForm.css:239-247` | `.mf-error` | `0.75rem` | 12px |

De opdracht vraagt expliciet naar foutmeldingen ≥14px — beide falen. `.mf-error` heeft betere contrast/leesbaarheid (donsere achtergrond, mono) maar is nog steeds klein voor een foutmelding die direct actie vereist.

### 3. Dropdown-opties (`CheckboxDropdown.css`) net onder de grens
`.cd-trigger` en `.cd-checkbox-label` (regels 15, 52): `0.85rem` = **13.6px**. Dit treft alle checkbox-dropdowns in het meldingsformulier (bijv. gezondheidsklachten-selectie).

### 4. Trust-score-badges: te klein én onvoldoende contrast (dubbel probleem)
| Bestand | Component | Font-size | px | Achtergrond | Tekstkleur | Contrast |
|---|---|---|---|---|---|---|
| `coordinatie/CoordinatiePage.jsx:333` | Tier-badge (melder-overzicht) | `0.6rem` | 9.6px | `tier.kleur` | `#fff` | zie tabel Stap 2 |
| `groepen/GroepPage.jsx:265` | Tier-badge (ledenlijst) | `0.55rem` | **8.8px** | `tier.kleur` | `#fff` | zie tabel Stap 2 |

`tier.kleur` (`lib/meldingen/trustScore.js`) is `var(--danger)` / `var(--warning)` / `#eab308` / `#22c55e`. **Alle vier** falen de WCAG-contrasteis voor witte tekst erop (zie Stap 2) — de badge-tekst is dus tegelijk te klein én te laag contrast, op een plek (Coördinatie/Groepen-ledenlijst) waar een beheerder juist snel een risico-tier moet kunnen aflezen.

### 5. Tijdlijn-kaarten (`MeldingCard.jsx` / `.css`) — Scenario B
| Element | Bestand | Waarde | px |
|---|---|---|---|
| Datum, afstand, melding-ID | `MeldingCard.css:45,67,88` | `0.6rem` | 9.6px |
| RFC 3161-status (✓/geen) | `MeldingCard.css:95` | `0.55rem` | 8.8px |
| Beschrijvingstekst | `MeldingCard.css:73` | `0.85rem` | 13.6px |
| Gezondheidsklacht/afwijzing-badges | `MeldingCard.jsx:135-150` | `0.6–0.65rem` | 9.6–10.4px |

Zowel de compacte als de volledige tijdlijn-kaart-variant zitten ruim onder de 14px-grens voor alle secundaire tekst.

### 6. Melding-detailmodal (`MeldingDetailModal.jsx`) — 12 van 15 inline font-sizes kritiek
Beschrijving (`.85rem`/13.6px, regel 166), gezondheidsklachten/activiteiten-tekst (`.75rem`/12px), SHA-256/RFC3161-blok (`.6rem`/9.6px, regels 327-341), Natura2000/KNMI-tekst (`.65-.8rem`). Dit is het scherm waar een gebruiker het bewijsmateriaal van een eigen melding controleert — juist hier is precisie/leesbaarheid van hash- en tijdstempelgegevens belangrijk, al is 13px voor mono-hashwaarden (zie vuistregel hieronder) op zichzelf acceptabel; de omringende labels (`.6-.65rem`) niet.

### 7. Navigatie — BottomNav tab-labels
| Breakpoint | Waarde | px |
|---|---|---|
| Standaard | `0.765rem` (`BottomNav.css:44`) | 12.24px |
| `max-width: 420px` | `0.612rem` (`BottomNav.css:87`) | **9.79px** |

Op kleine telefoons (< 420px breed — een reëel deel van het Android-middensegment) krimpen de tab-labels naar bijna 10px. De code-comments in dit bestand laten zien dat er al een bewuste "-15%"-verkleiningsronde heeft plaatsgevonden om labels niet te laten overlappen — een symptoom van te weinig ruimte, dat beter opgelost wordt met kortere labels of grotere iconen dan met een nog kleiner lettertype.

### 8. Juridische teksten — AV en Privacyverklaring
`onboarding/JuridischModal.css:51-56` (gedeeld door `AlgemeneVoorwaardenModal.jsx` en `PrivacyVerklaringModal.jsx`): `.juridisch-modal-body` = `0.85rem` = **13.6px**, `line-height: 1.6` (die laatste is al goed). Voor een juridisch document dat een gebruiker daadwerkelijk moet kunnen lezen (rechten, AVG-toestemming) is 13.6px net onder de kritieke grens.

### 9. Kwetsbare-groepen-selectie (AVG art. 9, bijzondere persoonsgegevens)
`instellingen/KwetsbareGroepen.jsx`: alle categorie-labels, uitlegtekst en waarschuwingstekst zitten op `0.8-0.85rem` (12.8-13.6px, regels 128-218). Dit is een progressive-disclosure-flow rond gevoelige gezondheidsgegevens — de tekst die de gebruiker leest vóórdat die instemt, verdient minstens `--font-size-sm`/`base`.

### 10. Overige structureel kleine tekst (representatief, niet uitputtend)
Vrijwel elk bestand met `.65rem`/`.6rem`/`.55rem`-declaraties: `AccountMenu.css` (melder-code, sync-status), `GroepenPage.css`/`GroepMeldingenLijst.jsx` (melder-code, stat-chips), `DashboardPage.css:15` (`0.55rem` = 8.8px, kleinste losstaande waarde in de hele Dashboard), `ExportPage.css`, `DriftZoneModal.css` (windzone/woning-detailtekst), `LocatieKaart.css` (GPS-coördinaten, afstand-tot-perceel, Natura2000-tekst — Scenario A), `NotificatiePopup.css`, `ClusterCard.css` (kleinste gevonden waarde in de hele app: `0.5rem` = **8px**, regel 122).

---

## Aandachtspunten 🟡 (14–15px)

| Bestand | Selector | Waarde | px |
|---|---|---|---|
| `melding/MeldingForm.css:132` | `.mf-select` (dropdown-veld) | `0.9rem` | 14.4px |
| `melding/MeldingForm.css:252` | `.mf-submit` (indien-knop) | `0.95rem` | 15.2px |
| `auth/AuthOverlay.css:115` | inlog-knop/veld | `0.9rem` | 14.4px |
| `ui/Collapsible.css:31` | sectie-titel | `0.9rem` | 14.4px |
| `export/SpuitregisterBrief.jsx:72,86` | naam/adres-invoervelden | `0.9rem` | 14.4px |
| `sync/SyncStatusBar.css:37` | sync-tekst | `14px` (expliciet) | 14px |
| `export/ExportPage.css:77`, `PrullenbakCard.css:7` | kaarttitels | `0.95rem` | 15.2px |
| `meldingen/ClusterCard.css:16`, `onboarding/HandleidingModal.css:124`, `feedback/FeedbackPage.css:71` | titels/koppen | `0.95rem` | 15.2px |

Deze zitten dicht bij de norm en zijn een logische Prioriteit-2-batch.

---

## Contrastproblemen

Berekend met de WCAG-relatieve-luminantieformule op de **actuele** kleuren uit `src/styles/theme.css` (zie correctie in de samenvatting).

| Tekstkleur | Achtergrond | Verhouding | WCAG-niveau | Aanbeveling |
|---|---|---|---|---|
| `--text-primary` `#e8edf5` | `--bg-primary` `#0a0e17` | **16.4:1** | ✅ AAA | — |
| `--text-secondary` `#7a90b0` | `--bg-primary` `#0a0e17` | **5.9:1** | 🟢 AA (alle tekst) | — |
| `--text-muted` `#4a5d78` | `--bg-primary` `#0a0e17` | **2.9:1** | 🔴 KRITIEK — faalt zelfs de 3:1-eis voor grote tekst | Verhogen naar minimaal `#5f7595` (≈4.5:1) of hergebruik `--text-secondary` voor tekst die leesbaar moet zijn (niet puur decoratief) |
| `--accent` `#04e6d9` | `--bg-primary` `#0a0e17` | **12.3:1** | ✅ AAA | — |
| `--warning` `#f59e0b` (als tekstkleur) | `--bg-primary` | **9.0:1** | ✅ AAA | — |
| `--danger` `#ef4444` (als tekstkleur) | `--bg-primary` | **5.1:1** | 🟢 AA | — |
| `--info` `#3b82f6` (als tekstkleur) | `--bg-primary` | **5.2:1** | 🟢 AA | — |
| `#fff` (badge-tekst) | `--danger` `#ef4444` (tier "0-19") | **3.8:1** | 🔴 KRITIEK (badge-tekst is 8.8-9.6px, dus geen "grote tekst"-uitzondering) | Donkere tekst (`#1a1a2e`) of donkerder badge-achtergrond |
| `#fff` (badge-tekst) | `--warning` `#f59e0b` (tier "20-39") | **2.1:1** | 🔴 KRITIEK | idem |
| `#fff` (badge-tekst) | `#eab308` (tier "40-79") | **1.9:1** | 🔴 KRITIEK — slechtste combinatie in de app | idem |
| `#fff` (badge-tekst) | `#22c55e` (tier "80-100") | **2.3:1** | 🔴 KRITIEK | idem |

**Speciale aandachtspunten:**
- **Placeholder-tekst**: nergens in `src/` staat een expliciete `::placeholder`-regel — placeholders erven de browserstandaard (met `color-scheme: dark` ingesteld in `index.css`). Contrast is dus niet auditeerbaar/consistent gegarandeerd; aanbeveling is een expliciete `::placeholder { color: var(--text-muted); }`-regel toe te voegen **nadat** `--text-muted` zelf is gecorrigeerd (zie hierboven).
- **Disabled-state**: `.btn-primary:disabled`/`.btn-outline:disabled` gebruiken `opacity: 0.6` i.p.v. een aparte kleur — dit verlaagt het al berekende contrast verder maar is voor disabled-elementen WCAG-technisch acceptabel (disabled content is uitgezonderd van de contrast-eis).
- `--text-muted` wordt gebruikt op precies de plekken die al als kritiek-klein zijn gemarkeerd (melder-codes, timestamps, GPS-coördinaten) — de combinatie van te klein én te laag contrast maakt die elementen dubbel kwetsbaar.

---

## Component-specifieke bevindingen per scenario

**Scenario A — Melding aanmaken buiten**: formulierlabels (`.section-label`, 10.4px) en checkbox-labels (`.mf-checkbox-label`, 12.5px) zijn de grootste risico's — zie bevinding 1. Dropdown-opties 13.6px (bevinding 3). GPS-coördinaten/afstand-tot-perceel-tekst in `LocatieKaart.css` 10.4-12.8px. Windpopup (`.locatie-kaart-windpopup`) heeft géén eigen `font-size` — erft de default en is daarmee (vermoedelijk) OK, maar niet expliciet geborgd.

**Scenario B — Tijdlijn lezen**: zie bevinding 5. Compacte en volledige kaartvariant delen dezelfde te kleine metadata-classes.

**Scenario C — Groepen/coördinatie**: trust-score-badges (bevinding 4) zijn het ernstigste punt — te klein én te laag contrast. Collapsible-headers zelf zijn `0.9rem` (14.4px, 🟡) met voldoende touch-target (`min-height` via bestaande HIG-utility).

**Scenario D — Instellingen/juridisch**: AV/Privacyverklaring-body 13.6px (bevinding 8), kwetsbare-groepen-tekst 12.8-13.6px (bevinding 9, AVG-gevoelig). Footer/versienummer-tekst (`.juridisch-modal-footer`, 10.4px) is passend klein voor "kleine print" (≥ genoemde 12px-ondergrens wordt hier wél overschreden — dit stuk mag eventueel als bewuste uitzondering blijven staan, zie Prioriteit 3).

**Scenario E — Navigatie**: zie bevinding 7. Actieve/inactieve contrastkeuze is al bewust gedocumenteerd in de code (`BottomNav.css` regel 49-52, `--text-secondary` i.p.v. `--text-muted` met een expliciet genoemde 5.39:1-ratio) — dit is een voorbeeld van eerder al correct uitgevoerde contrastoverweging, alleen de font-size zelf is niet aangepast in diezelfde ronde.

---

## Positieve bevindingen 🟢

- **Contrast van de hoofdkleuren is uitstekend**: `--text-primary` (16.4:1) en `--accent` (12.3:1) tegen de achtergrond zitten ruim boven AAA. Het enige structurele contrastprobleem zit bij `--text-muted` en de vier tier-badges, niet bij de kernkleuren.
- **`line-height`** is op de belangrijkste leesteksten al ≥1.4-1.6 (`.melding-card-desc`: 1.4, `.juridisch-modal-body`: 1.6, `WaaromDitErtoeDoetModal`-lijsten: 1.5) — de vuistregel uit de opdracht is hier dus al grotendeels gevolgd, ook al is de font-size zelf nog te klein.
- **Touch-targets** zijn al eerder geaudit en gefixt: `.btn-primary`/`.btn-outline`/`.form-input` hebben `min-height: 44-48px` (Apple HIG), zie `theme.css` regel 176-182 en de comment die verwijst naar een eerdere toegankelijkheidsronde (2026-06-29).
- **BottomNav-contrastkeuze** (`--text-secondary` i.p.v. `--text-muted`) is een voorbeeld van een eerder bewust genomen, correcte contrastbeslissing — het patroon kan hergebruikt worden om `--text-muted` elders te vervangen.
- **Expliciete 16px-uitzonderingen bestaan al** op drie plekken (`InstallBanner.css:30`, `UpdateBanner.css:43`, `SyncStatusBar.css:52`) — een teken dat het team al weet wanneer 16px nodig is; deze drie zijn een goed voorbeeld om naar de rest van de app te extrapoleren.
- Geen gebruik van `font-weight: 300` op kleine tekst aangetroffen — de in de opdracht genoemde valkuil (dunne letters die verdwijnen in buitenlicht) komt in de huidige code niet voor.

---

## Aanbevelingen

### Prioriteit 1 — Direct aanpassen (kritiek voor buiten-gebruik)
1. `.section-label` (theme.css) → minimaal 14px, bij voorkeur 16px — raakt alle formulierlabels.
2. `.toast` / `.mf-error` (foutmeldingen) → minimaal 14px.
3. `--text-muted` kleurwaarde → contrast repareren (2.9:1 → ≥4.5:1).
4. Trust-tier-badges (`trustScore.js` kleuren + badge-tekstkleur) → zowel font-size (naar ≥12px, badges mogen als uitzondering iets kleiner dan body blijven, maar niet onder 12px) als contrast (witte tekst vervangen of achtergrond verdonkeren) samen oplossen — losse fixes lossen het probleem niet op.
5. `.mf-checkbox-label`, `CheckboxDropdown`-classes, `.melding-card-desc`, `.juridisch-modal-body`, `KwetsbareGroepen`-teksten → naar 14-16px.
6. `BottomNav`-tab-labels, met name de `max-width:420px`-variant (9.8px) → structurele oplossing (kortere labels/layout) i.p.v. verdere verkleining.

### Prioriteit 2 — Aanpassen bij gelegenheid (14-15px, sectie "Aandachtspunten")
`.mf-select`, `.mf-submit`, Collapsible-titels, kaarttitels op `0.95rem` → naar 16px voor consistentie met het nieuwe tokensysteem.

### Prioriteit 3 — Overwegen (contrast-only, buitenlicht-optimalisatie)
- Volledige doorlichting van alle plekken die `--text-muted` gebruiken (nu > 30 plekken) nadat de kleur zelf is aangepast — sommige (bv. `.juridisch-modal-footer`, copyright-regels) zijn bewust "kleine print" en hoeven niet per se qua *grootte* mee, wel qua *contrast*.
- Overweeg `--accent`-gebruik te consolideren: enkele bestanden (`LocatieKaart.css`, `DashboardKaart.jsx`, `driftzone.js`) gebruiken nog het hardcoded oude teal `#00d4aa` i.p.v. `var(--accent)` (nu `#04e6d9`) — geen typografie-issue, maar wel relevant voor consistentie als er straks kleurcorrecties volgen. Buiten scope van deze audit, alleen ter observatie.

---

## Voorgestelde CSS-variabelen

Toe te voegen aan `src/styles/theme.css` (naast de bestaande `:root`-tokens, geen bestaand token wordt hierdoor overschreven):

```css
--font-size-xs:   12px;  /* Alleen voor labels/badges, nooit body */
--font-size-sm:   14px;  /* Secundaire tekst, metadata */
--font-size-base: 16px;  /* Body-tekst, formulierlabels */
--font-size-md:   18px;  /* Aanbevolen voor buiten-gebruik body */
--font-size-lg:   20px;  /* Subtitels, sectiekoppen */
--font-size-xl:   24px;  /* Paginatitels */
--font-size-2xl:  32px;  /* Hero/display tekst */
```

Vuistregel voor mono-tekst (melder-codes, SHA-256-hashes, coördinaten): 1-2px kleiner dan `--font-size-base` toegestaan, nooit onder 13px.

---

## Volgende stap

Dit rapport is Fase 1. Er is **geen code gewijzigd**. Graag bevestiging welke Prioriteit 1/2/3-items daadwerkelijk doorgevoerd mogen worden voordat Fase 2 (implementatie) start — met name bevinding 4 (trust-tier-badges) en de `--text-muted`-kleurwijziging raken meerdere bestanden tegelijk en verdienen expliciete goedkeuring.

import { JuridischModal } from './JuridischModal.jsx';

const VERSIE = '1.0';
const LAATST_GEWIJZIGD = '21-06-2026';

export function AlgemeneVoorwaardenModal({ onSluiten }) {
  return (
    <JuridischModal titel="Algemene Voorwaarden" versie={VERSIE} laatstGewijzigd={LAATST_GEWIJZIGD} onSluiten={onSluiten}>
      {`ARTIKEL 1 — DEFINITIES
1.1 "Platform": SpuitLogger, de webapplicatie.
1.2 "Gebruiker": iedere persoon die een account aanmaakt.
1.3 "Melding": een door de gebruiker aangemaakte registratie van spuitactiviteit inclusief alle bijbehorende data.
1.4 "Dossier": een verzameling meldingen van één gebruiker.
1.5 "Buurtdossier": een geanonimiseerde samenvoeging van meldingen van meerdere gebruikers in een geografisch gebied.

ARTIKEL 2 — GEBRUIK VAN HET PLATFORM
2.1 SpuitLogger is bedoeld voor het registreren van waargenomen spuitactiviteiten in de directe omgeving van de gebruiker.
2.2 De gebruiker mag het platform uitsluitend gebruiken voor rechtmatige doeleinden conform Nederlands recht.
2.3 Misbruik — waaronder het bewust invoeren van valse meldingen, systematische intimidatie van telers, of gecoördineerde lastercampagnes — is verboden en kan leiden tot onmiddellijke beëindiging van het account.
2.4 Het platform is geen substituut voor professioneel juridisch advies. Raadpleeg een advocaat voor juridische procedures.

ARTIKEL 3 — BEWIJSWAARDE EN AANSPRAKELIJKHEID
3.1 SpuitLogger biedt technische hulpmiddelen voor documentatie (tijdstempels, hashing, weerdata). Het platform garandeert niet dat meldingen in juridische procedures als bewijs worden geaccepteerd.
3.2 De gebruiker is zelf verantwoordelijk voor de juistheid van ingevoerde informatie.
3.3 SpuitLogger is niet aansprakelijk voor schade voortvloeiend uit het gebruik van het platform of de gegenereerde dossiers.
3.4 De gebruiker vrijwaart SpuitLogger van aanspraken van derden die voortvloeien uit door de gebruiker ingevoerde gegevens.

ARTIKEL 4 — INTELLECTUEEL EIGENDOM
4.1 De gebruiker behoudt eigendom van zijn eigen meldingen en dossiers.
4.2 Door gebruik van het platform verleent de gebruiker SpuitLogger een beperkte licentie om de data te verwerken voor de doeleinden beschreven in de privacyverklaring.
4.3 Geanonimiseerde, geaggregeerde data kan worden gebruikt voor wetenschappelijk onderzoek (zie privacyverklaring artikel 3), tenzij u dit heeft uitgeschakeld via Instellingen.

ARTIKEL 5 — BESCHIKBAARHEID EN WIJZIGINGEN
5.1 SpuitLogger streeft naar maximale beschikbaarheid maar garandeert geen ononderbroken toegang.
5.2 SpuitLogger behoudt het recht de voorwaarden te wijzigen met 30 dagen voorafgaande kennisgeving via de app.
5.3 Voortgezet gebruik na kennisgeving van wijziging geldt als acceptatie.

ARTIKEL 6 — BEËINDIGING
6.1 De gebruiker kan het account te allen tijde verwijderen via Instellingen.
6.2 SpuitLogger kan accounts met onmiddellijke ingang beëindigen bij aantoonbaar misbruik (artikel 2.3) of op last van een bevoegde autoriteit.
6.3 Na beëindiging worden persoonsgegevens verwijderd conform de privacyverklaring. Meldingen die deel uitmaken van een actief juridisch dossier kunnen langer worden bewaard op grond van wettelijke bewaarplicht.

ARTIKEL 7 — TOEPASSELIJK RECHT
7.1 Op deze voorwaarden is uitsluitend Nederlands recht van toepassing.
7.2 Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
7.3 Voor klachten over gegevensverwerking kunt u terecht bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).`}
    </JuridischModal>
  );
}

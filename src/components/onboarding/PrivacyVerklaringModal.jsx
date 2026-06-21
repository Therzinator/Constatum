import { JuridischModal } from './JuridischModal.jsx';

const VERSIE = '1.0';
const LAATST_GEWIJZIGD = '21-06-2026';

export function PrivacyVerklaringModal({ onSluiten }) {
  return (
    <JuridischModal titel="Privacyverklaring" versie={VERSIE} laatstGewijzigd={LAATST_GEWIJZIGD} onSluiten={onSluiten}>
      {`1. WIE WE ZIJN
SpuitLogger is een registratieplatform voor burgers die spuitactiviteiten met gewasbeschermingsmiddelen willen documenteren. Het platform dient als juridisch dossierinstrument voor bewoners in de nabijheid van agrarische percelen.

2. WELKE GEGEVENS WE VERWERKEN
Wij verwerken de volgende persoonsgegevens:
• E-mailadres — voor authenticatie; bij synchronisatie van meldingen wordt het e-mailadres als SHA-256 hash opgeslagen, niet in leesbare vorm
• Locatiegegevens van meldingen — GPS-coördinaten van de spuitlocatie
• Thuislocatie — voor afstandsberekeningen, alleen voor uzelf zichtbaar
• Gezondheidsklachten — alleen als u dit zelf invult en hiervoor expliciet toestemming geeft (bijzondere categorie persoonsgegevens)
• Foto's en video's — EXIF-locatiedata wordt automatisch uit foto's verwijderd vóór opslag
• Tijdstempels — vastgelegd via RFC 3161 voor juridische integriteit
• Weerdata — automatisch opgehaald op basis van de meldingslocatie (KNMI)

3. WAAROM WE DEZE GEGEVENS VERWERKEN
• Juridische documentatie van spuitactiviteiten (gerechtvaardigd belang)
• Ondersteuning bij handhavingsverzoeken bij NVWA en omgevingsdiensten
• Opbouw van een buurtdossier — uitsluitend met uw expliciete keuze per melding ("delen met de buurt")
• Onderzoek naar pesticideblootstelling — uitsluitend geanonimiseerd en geaggregeerd, met uw opt-in (standaard ingeschakeld, uitschakelbaar via Instellingen → Gegevens & Privacy)

4. HOE LANG WE GEGEVENS BEWAREN
• Meldingen: maximaal 10 jaar (juridische bewaartermijn dossiers)
• Accountgegevens: tot verwijdering van uw account + 30 dagen
• Na verwijdering worden uw gegevens binnen 30 dagen volledig gewist

5. MET WIE WE GEGEVENS DELEN
• Supabase (verwerker, EU-servers) — voor opslag
• Freetsa.org — uitsluitend de SHA-256 hash van uw melding, geen persoonsgegevens
• KNMI Open Data — geen persoonsgegevens
• Rechterlijke instanties — alleen op uw verzoek of bij rechtbankbevel
• Onderzoekers — uitsluitend volledig geanonimiseerde, geaggregeerde data

Wij verkopen uw gegevens nooit aan derden.

6. UW RECHTEN (AVG art. 15-22)
U heeft het recht op inzage, rectificatie, verwijdering ("recht op vergetelheid"), beperking van verwerking, overdraagbaarheid en bezwaar tegen verwerking op basis van gerechtvaardigd belang. Inzage en verwijdering regelt u zelf via Instellingen → Gegevens & Privacy. U kunt een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).

7. BEVEILIGING
• Versleutelde opslag en verbindingen via HTTPS/TLS
• SHA-256-hashing van bewijsmateriaal voor integriteitsborging
• RFC 3161-tijdstempeling via een onafhankelijke tijdstempelautoriteit

8. COOKIES EN TRACKING
SpuitLogger gebruikt geen tracking cookies of advertentietrackers. Uitsluitend functionele cookies voor sessiebeheer.

9. WIJZIGINGEN
Bij wezenlijke wijzigingen ontvangt u een melding in de app.`}
    </JuridischModal>
  );
}

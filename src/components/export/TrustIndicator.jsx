// Coordinatie & Admin systeem, Fase 3 — trust-indicator zichtbaar voor de
// melder zelf. Staat — net als NotificatieInstellingen/KNMIInstellingen —
// voorlopig in ExportPage tot er een eigen Instellingen-pagina is (Fase G,
// zie comment in ExportPage.jsx).
export function TrustIndicator({ profiel }) {
  if (!profiel) return null;

  const { trust_score: trustScore, telefoon_geverifieerd: telefoonGeverifieerd, account_aangemaakt: accountAangemaakt } = profiel;
  const accountDagen = accountAangemaakt
    ? Math.floor((Date.now() - new Date(accountAangemaakt).getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const nieuwAccount = accountDagen != null && accountDagen < 7;

  return (
    <div className="card p-4">
      <div className="section-label mb-3">🛡️ Account-betrouwbaarheid</div>

      <div className="export-info-rij">
        <span>Trust score</span>
        <span>{trustScore ?? '—'} / 100</span>
      </div>

      <div className="export-info-rij">
        <span>Telefoon geverifieerd</span>
        <span>{telefoonGeverifieerd ? '✓ Ja' : 'Nee'}</span>
      </div>

      {accountDagen != null && (
        <div className="export-info-rij">
          <span>Account aangemaakt</span>
          <span>{accountDagen === 0 ? 'Vandaag' : `${accountDagen} dag${accountDagen === 1 ? '' : 'en'} geleden`}</span>
        </div>
      )}

      {nieuwAccount && (
        <div className="export-card-beschrijving mt-2">
          Nieuwe accounts (eerste 7 dagen) worden automatisch beoordeeld vóór
          meldingen breder zichtbaar worden — dit helpt misbruik te voorkomen.
        </div>
      )}
    </div>
  );
}

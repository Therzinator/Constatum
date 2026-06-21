import { useEffect, useRef, useState } from 'react';
import { APP_VERSION_CLIENT } from '../../lib/version.js';
import './AccountMenu.css';

// Vervangt het kale versienummer in de headerbalk (AppHeader.jsx) door een
// knop die een account-menu opent — gegevens aanpassen gebeurt al via de
// bestaande Instellingen-pagina (GegevensPrivacyInstelling.jsx e.a.), dit
// menu is dus vooral een snelle ingang daarnaartoe + een directe
// synchronisatie-knop, niet een dubbele set formuliervelden.
export function AccountMenu({ user, onNavigeerInstellingen, syncNu, syncBezig, onUitloggen }) {
  const [open, setOpen] = useState(false);
  const [lokaalBezig, setLokaalBezig] = useState(false);
  const [laatsteSyncResultaat, setLaatsteSyncResultaat] = useState(null); // 'ok' | 'fout' | null
  const menuRef = useRef(null);

  // Sluiten bij een klik buiten het menu of bij Escape — zelfde patroon
  // als JuridischModal.jsx (Escape), aangevuld met outside-click omdat dit
  // een los dropdown-paneel is, geen modal met eigen overlay.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => { if (!menuRef.current?.contains(e.target)) setOpen(false); };
    const handleEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  // Verbergt de markering weer na 2.5s.
  useEffect(() => {
    if (!laatsteSyncResultaat) return;
    const timer = setTimeout(() => setLaatsteSyncResultaat(null), 2500);
    return () => clearTimeout(timer);
  }, [laatsteSyncResultaat]);

  // Direct gekoppeld aan het resultaat van de syncNu()-aanroep zelf i.p.v.
  // het volgen van syncBezig/syncStatus-props: als er niets te
  // synchroniseren is, voltooit syncNu() zo snel (geen await raakt een
  // echte netwerkwachttijd) dat React de bezig:true->false-overgang in
  // ÉÉN render batcht — een effect dat op die props-overgang luisterde
  // zag de tussenstap dan nooit en toonde dus nooit feedback ("de sync
  // doet niks"). Door zelf op de promise te wachten is dit onafhankelijk
  // van hoe/of de bovenliggende hook tussentijds rendert.
  const handleSync = async () => {
    if (!syncNu || lokaalBezig) return;
    setLokaalBezig(true);
    setLaatsteSyncResultaat(null);
    try {
      const resultaat = await syncNu();
      setLaatsteSyncResultaat(resultaat ? (resultaat.mislukt > 0 ? 'fout' : 'ok') : null);
    } finally {
      setLokaalBezig(false);
    }
  };

  const handleInstellingen = () => {
    setOpen(false);
    onNavigeerInstellingen?.();
  };

  const handleUitloggen = () => {
    setOpen(false);
    onUitloggen?.();
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu-knop"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        title="Account"
      >
        👤
      </button>

      {open && (
        <div className="account-menu-paneel" role="menu">
          <div className="account-menu-gebruiker">
            {user?.email ? user.email : 'Niet ingelogd'}
          </div>

          {user && (
            <button
              type="button"
              className={`account-menu-item account-menu-sync ${laatsteSyncResultaat ? `account-menu-sync-${laatsteSyncResultaat}` : ''}`}
              onClick={handleSync}
              disabled={lokaalBezig || syncBezig}
            >
              {lokaalBezig || syncBezig
                ? '⏳ Synchroniseren...'
                : laatsteSyncResultaat === 'ok'
                  ? '✓ Synchronisatie gelukt'
                  : laatsteSyncResultaat === 'fout'
                    ? '✗ Synchronisatie deels mislukt'
                    : '🔄 Synchroniseer nu'}
            </button>
          )}

          <button type="button" className="account-menu-item" onClick={handleInstellingen}>
            ⚙️ Mijn gegevens &amp; instellingen
          </button>

          {user && (
            <button type="button" className="account-menu-item account-menu-uitloggen" onClick={handleUitloggen}>
              🚪 Uitloggen
            </button>
          )}

          <div className="account-menu-versie">v{APP_VERSION_CLIENT}</div>
        </div>
      )}
    </div>
  );
}

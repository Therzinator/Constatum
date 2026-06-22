import { useLayoutEffect, useRef } from 'react';
import { AccountMenu } from './AccountMenu.jsx';
import './AppHeader.css';

// Vaste headerbalk met het SpuitLogger-logo — de app had voorheen helemaal
// geen header (zie ook OnlineIndicator.jsx), waardoor er nergens merk-
// herkenning was en losse paginatitels (bv. ExportPage) zonder omlijnende
// kaart op de onderliggende paginakleur bleven staan.
//
// Schrijft de eigen, werkelijke hoogte naar --header-hoogte (CSS-variabele,
// zie styles/theme.css) zodat andere vast-gepositioneerde elementen (bv.
// VoortgangBalk.jsx) er exact — zonder gat of overlap — onder kunnen
// aansluiten, ook als de header-hoogte ooit verandert (logo/font/zoom).
export function AppHeader({ user, onNavigeerInstellingen, onNavigeerUitnodigen, syncNu, syncBezig, laadVanCloud, onUitloggen }) {
  const headerRef = useRef(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    // getBoundingClientRect (fractioneel) i.p.v. offsetHeight (geheel
    // getal) — anders blijft er door afronding een sub-pixel gaatje over
    // tussen header en de elementen die er vlak onder aansluiten.
    const zetHoogte = () => {
      document.documentElement.style.setProperty('--header-hoogte', `${el.getBoundingClientRect().height}px`);
    };
    const observer = new ResizeObserver(zetHoogte);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="app-header" ref={headerRef}>
      <img src="/icons/header-logo.png" alt="SpuitLogger" className="app-header-logo" />
      <div className="app-header-tekst">
        <span className="app-header-titel">SpuitLogger</span>
        <span className="app-header-subtitel">Spuitactiviteiten Dossier</span>
      </div>
      <button
        type="button"
        className="app-header-uitnodigen-knop"
        onClick={onNavigeerUitnodigen}
        title="Buren uitnodigen"
        aria-label="Buren uitnodigen"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="8" r="4" />
          <path d="M2 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 1.5.19" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </svg>
        <span className="app-header-knop-label">Uitnodigen</span>
      </button>
      <AccountMenu
        user={user}
        onNavigeerInstellingen={onNavigeerInstellingen}
        syncNu={syncNu}
        syncBezig={syncBezig}
        laadVanCloud={laadVanCloud}
        onUitloggen={onUitloggen}
      />
    </header>
  );
}

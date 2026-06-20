import { APP_VERSION_CLIENT } from '../../lib/version.js';
import './AppHeader.css';

// Vaste headerbalk met het SpuitLogger-logo — de app had voorheen helemaal
// geen header (zie ook OnlineIndicator.jsx), waardoor er nergens merk-
// herkenning was en losse paginatitels (bv. ExportPage) zonder omlijnende
// kaart op de onderliggende paginakleur bleven staan.
export function AppHeader() {
  return (
    <header className="app-header">
      <img src="/icons/header-logo.png" alt="SpuitLogger" className="app-header-logo" />
      <div className="app-header-tekst">
        <span className="app-header-titel">SpuitLogger</span>
        <span className="app-header-subtitel">Spuitactiviteiten Dossier</span>
      </div>
      <span className="app-header-versie">v{APP_VERSION_CLIENT}</span>
    </header>
  );
}

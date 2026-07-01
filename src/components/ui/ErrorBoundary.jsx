import { Component } from 'react';
import './ErrorBoundary.css';

// Vangt onverwachte render-fouten op die anders de hele React-boom laten
// verdwijnen (zwart scherm) — er was tot nu toe geen andere error boundary
// in de app. Gebeurde concreet bij uitloggen (2026-07-01): een
// null-referentie ergens in de paginaboom crashte de render, en zonder
// boundary verdween ook AuthOverlay (sibling, buiten deze boundary) mee —
// de gebruiker kwam dus nergens meer terecht i.p.v. terug bij het
// inlogscherm. `onFout` laat de aanroeper (App.jsx) naar een veilige
// pagina + het inlogscherm terugschakelen; de `key`-prop die App.jsx
// meegeeft (de actieve pagina) forceert daarna een volledige remount,
// zodat deze fout-status niet blijft "vastplakken".
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fout: null };
  }

  static getDerivedStateFromError(fout) {
    return { fout };
  }

  componentDidCatch(fout, info) {
    console.error('[ErrorBoundary]', fout, info?.componentStack);
    this.props.onFout?.(fout);
  }

  render() {
    if (this.state.fout) {
      return (
        <div className="app-fout-scherm">
          <div className="app-fout-titel">Er ging iets mis</div>
          <div className="app-fout-tekst">
            Deze pagina kon niet worden weergegeven. Je bent teruggezet naar
            het inlogscherm; als het probleem blijft terugkomen, herlaad dan
            de pagina.
          </div>
          <button type="button" className="btn-primary px-4 py-2" onClick={() => window.location.reload()}>
            Pagina herladen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

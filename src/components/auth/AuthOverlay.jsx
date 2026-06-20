import { useState } from 'react';
import './AuthOverlay.css';

// React-versie van het #auth-overlay blok + authTab/authSubmit/authSkip uit
// docs/index.html. `auth` is het object dat hooks/useAuth.js teruggeeft.
export function AuthOverlay({ auth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupInfo, setSignupInfo] = useState(null);

  const {
    authOverlayVisible,
    authMode,
    authError,
    authBusy,
    setAuthMode,
    login,
    signup,
    skip
  } = auth;

  if (!authOverlayVisible) return null;

  const kiesTab = (mode) => {
    setAuthMode(mode);
    setSignupInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupInfo(null);

    const result = authMode === 'login'
      ? await login(email, password)
      : await signup(email, password);

    if (!result.error && authMode === 'signup' && !result.data?.session) {
      setSignupInfo('✓ Bevestigingsmail verstuurd. Controleer uw inbox.');
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-title">SpuitLogger</div>
        <div className="auth-sub">SPUITACTIVITEITEN DOSSIER — INLOGGEN</div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => kiesTab('login')}
          >
            Inloggen
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => kiesTab('signup')}
          >
            Registreren
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <label className="section-label" htmlFor="auth-email">E-mailadres</label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="naam@voorbeeld.nl"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="section-label" htmlFor="auth-password">Wachtwoord</label>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {authError && <div className="auth-error">{authError}</div>}
          {signupInfo && <div className="auth-info">{signupInfo}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={authBusy}>
            {authBusy
              ? (authMode === 'login' ? 'Inloggen...' : 'Registreren...')
              : (authMode === 'login' ? 'Inloggen' : 'Registreren')}
          </button>
        </form>

        <button type="button" className="auth-skip" onClick={skip}>
          Overslaan — alleen lokaal werken (geen sync)
        </button>
      </div>
    </div>
  );
}

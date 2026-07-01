import * as Sentry from '@sentry/react';

// Alleen actief als er een DSN is ingesteld (VITE_SENTRY_DSN, Vercel env
// var) — zonder DSN blijft de app exact zoals voorheen, geen enkele call
// naar een externe dienst. Net als Supabase (lib/supabase/client.js) staat
// dit ook op localhost standaard uit, zodat lokale ontwikkelfouten nooit
// in productie-Sentry belanden.
const DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_LOCALHOST = typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const SENTRY_ENABLED = Boolean(DSN) && !IS_LOCALHOST;

// Bewust GEEN performance tracing en GEEN session replay: dit is een
// AVG-gevoelige app (spuitlocaties, gezondheidsklachten, GPS-coördinaten)
// en replay zou effectief een scherm-opname van die gegevens naar een
// derde partij sturen. sendDefaultPii blijft uit (SDK-default, hier
// expliciet voor duidelijkheid).
export function initSentry() {
  if (!SENTRY_ENABLED) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    // xhr/fetch-breadcrumbs bevatten request-URL's die GPS-coördinaten
    // (PDOK-aanroepen) of tokens (Supabase signed URLs, groep-
    // uitnodigingslinks) kunnen bevatten — die laten we altijd weg.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') return null;
      return breadcrumb;
    }
  });
}

// Aparte functie i.p.v. rechtstreeks Sentry.captureException aanroepen op
// de call-sites — zo blijft SENTRY_ENABLED de enige plek die weet of
// Sentry actief is, en is de aanroep hetzelfde ongeacht configuratie.
export function captureFout(fout, extra) {
  if (!SENTRY_ENABLED) return;
  Sentry.captureException(fout, extra ? { extra } : undefined);
}
